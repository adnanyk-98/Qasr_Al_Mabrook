import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const marketingPattern = /(?:web|webbanner|galleryimage|banner|hero|marketing)/i;
const numberedPattern = /^(.*?)-#(\d+)$/;

const manifestSchema = z.object({
  products: z.array(
    z.object({
      category: z.string().min(1),
      name: z.string().min(1),
      images: z.array(z.string().min(1)).min(1),
      primaryImage: z.string().min(1).optional(),
    }),
  ),
  unresolvedImages: z.array(z.string().min(1)).default([]),
});

type CatalogueManifest = z.infer<typeof manifestSchema>;

export type DiscoveredImage = {
  filename: string;
  relativePath: string;
  role: "gallery" | "marketing";
  sortOrder: number;
  width?: number;
  height?: number;
};

export type DiscoveredProduct = {
  category: string;
  name: string;
  images: DiscoveredImage[];
  primaryImage: string;
};

export type DiscoveryReport = {
  source: string;
  categories: string[];
  products: DiscoveredProduct[];
  ignoredDirectories: string[];
  unassignedImages: string[];
  ambiguousImages: string[];
  manifestUsed: boolean;
  manifestErrors: string[];
  unreferencedManifestImages: string[];
};

function displayName(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) =>
      /^\d+(?:\.\d+)?m$/i.test(word)
        ? word.toUpperCase()
        : `${word[0]?.toUpperCase() ?? ""}${word.slice(1).toLowerCase()}`,
    )
    .join(" ");
}

function imageRole(filename: string): "gallery" | "marketing" {
  return marketingPattern.test(path.parse(filename).name) ? "marketing" : "gallery";
}

function productNameFromFilename(category: string, filename: string) {
  const stem = path.parse(filename).name;
  const numbered = stem.match(numberedPattern);
  const family =
    numbered?.[1] ??
    stem.replace(/-(?:WEB|WebBanner|GalleryImage|Banner|Hero|marketing).*$/i, "");

  if (!numbered && marketingPattern.test(stem) && !family.trim()) return null;
  if (category.toLowerCase() === "measuring tape" && numbered)
    return displayName(numbered[1]);
  return displayName(family);
}

function sortOrder(filename: string) {
  const match = path.parse(filename).name.match(numberedPattern);
  return match ? Number(match[2]) : 1000;
}

async function readImageDimensions(filePath: string) {
  const buffer = await readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();
  if (
    extension === ".png" &&
    buffer.length >= 24 &&
    buffer.toString("ascii", 1, 4) === "PNG"
  ) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (
    (extension === ".jpg" || extension === ".jpeg") &&
    buffer.length > 4 &&
    buffer.readUInt16BE(0) === 0xffd8
  ) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
        ].includes(marker)
      ) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      if (length < 2) break;
      offset += 2 + length;
    }
  }
  if (
    extension === ".gif" &&
    buffer.length >= 10 &&
    buffer.toString("ascii", 0, 3) === "GIF"
  ) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  return undefined;
}

async function createImage(
  source: string,
  category: string,
  filename: string,
): Promise<DiscoveredImage> {
  const dimensions = await readImageDimensions(path.join(source, category, filename));
  return {
    filename,
    relativePath: `${category}/${filename}`,
    role: imageRole(filename),
    sortOrder: sortOrder(filename),
    ...dimensions,
  };
}

async function listImageFiles(directory: string) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()),
    )
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

async function loadManifest(source: string, filesByRelativePath: Set<string>) {
  const manifestPath = path.join(source, "catalogue-manifest.json");
  try {
    const raw = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
    const parsed = manifestSchema.safeParse(raw);
    if (!parsed.success)
      return {
        manifest: null,
        errors: parsed.error.issues.map((issue) => issue.message),
      };

    const assigned = new Set<string>();
    const errors: string[] = [];
    for (const product of parsed.data.products) {
      for (const filename of product.images) {
        const relativePath = path
          .join(product.category, filename)
          .replaceAll("\\", "/");
        if (!filesByRelativePath.has(relativePath))
          errors.push(`Missing manifest file: ${relativePath}`);
        if (assigned.has(relativePath))
          errors.push(`Duplicate manifest assignment: ${relativePath}`);
        assigned.add(relativePath);
      }
      if (product.primaryImage && !product.images.includes(product.primaryImage)) {
        errors.push(
          `Primary image is not listed in images: ${product.category}/${product.primaryImage}`,
        );
      }
    }
    const unresolved = new Set<string>();
    for (const relativePath of parsed.data.unresolvedImages) {
      if (!filesByRelativePath.has(relativePath))
        errors.push(`Missing unresolved file: ${relativePath}`);
      if (assigned.has(relativePath))
        errors.push(`Image is both assigned and unresolved: ${relativePath}`);
      if (unresolved.has(relativePath))
        errors.push(`Duplicate unresolved image: ${relativePath}`);
      unresolved.add(relativePath);
    }
    return { manifest: parsed.data, errors, assigned, unresolved };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return {
        manifest: null,
        errors: [],
        assigned: new Set<string>(),
        unresolved: new Set<string>(),
      };
    return {
      manifest: null,
      errors: [
        `Invalid catalogue-manifest.json: ${error instanceof Error ? error.message : "unknown error"}`,
      ],
      assigned: new Set<string>(),
      unresolved: new Set<string>(),
    };
  }
}

export async function discoverCatalogue(source: string): Promise<DiscoveryReport> {
  const resolvedSource = path.resolve(source);
  const directories = (await readdir(resolvedSource, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const ignoredDirectories = directories.filter(
    (directory) => directory.toLowerCase() === "logo",
  );
  const categories = directories.filter(
    (directory) => !ignoredDirectories.includes(directory),
  );
  const filesByRelativePath = new Set<string>();
  for (const category of categories) {
    for (const filename of await listImageFiles(path.join(resolvedSource, category))) {
      filesByRelativePath.add(`${category}/${filename}`);
    }
  }

  const manifestResult = await loadManifest(resolvedSource, filesByRelativePath);
  const products: DiscoveredProduct[] = [];
  const unassignedImages: string[] = [];
  const ambiguousImages: string[] = [];

  if (manifestResult.manifest) {
    for (const product of manifestResult.manifest.products) {
      const images = (
        await Promise.all(
          product.images.map((filename) =>
            createImage(resolvedSource, product.category, filename),
          ),
        )
      ).sort(
        (left, right) =>
          left.sortOrder - right.sortOrder ||
          left.filename.localeCompare(right.filename),
      );
      products.push({
        category: product.category,
        name: product.name,
        images,
        primaryImage: product.primaryImage ?? images[0].filename,
      });
    }
    const assigned = manifestResult.assigned ?? new Set<string>();
    const unresolved = manifestResult.unresolved ?? new Set<string>();
    for (const relativePath of filesByRelativePath) {
      if (unresolved.has(relativePath)) ambiguousImages.push(relativePath);
      else if (!assigned.has(relativePath)) unassignedImages.push(relativePath);
    }
    return {
      source: resolvedSource,
      categories,
      products,
      ignoredDirectories,
      unassignedImages,
      ambiguousImages,
      manifestUsed: true,
      manifestErrors: manifestResult.errors,
      unreferencedManifestImages: unassignedImages,
    };
  }

  for (const category of categories) {
    const grouped = new Map<string, DiscoveredImage[]>();
    for (const filename of await listImageFiles(path.join(resolvedSource, category))) {
      const name = productNameFromFilename(category, filename);
      const relativePath = `${category}/${filename}`;
      if (!name) {
        unassignedImages.push(relativePath);
        continue;
      }
      if (
        category.toLowerCase() === "measuring tape" &&
        !numberedPattern.test(path.parse(filename).name)
      ) {
        ambiguousImages.push(relativePath);
        continue;
      }
      const images = grouped.get(name) ?? [];
      images.push(await createImage(resolvedSource, category, filename));
      grouped.set(name, images);
    }
    for (const [name, images] of grouped) {
      images.sort(
        (left, right) =>
          left.sortOrder - right.sortOrder ||
          left.filename.localeCompare(right.filename),
      );
      products.push({ category, name, images, primaryImage: images[0].filename });
    }
  }

  return {
    source: resolvedSource,
    categories,
    products,
    ignoredDirectories,
    unassignedImages,
    ambiguousImages,
    manifestUsed: false,
    manifestErrors: manifestResult.errors,
    unreferencedManifestImages: [],
  };
}

export async function validateCatalogueSource(source: string) {
  const sourceStat = await stat(source);
  if (!sourceStat.isDirectory())
    throw new Error(`Catalogue source is not a directory: ${source}`);
}

export type { CatalogueManifest };
