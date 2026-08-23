import { listHomepageSections } from '../src/server/repositories/catalog-admin';

(async () => {
  try {
    const rows = await listHomepageSections();
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(2);
  }
})();
