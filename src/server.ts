import 'module-alias/register';
import App from './app';
import ListingsController from '@controllers/ListingsController';
import ListingExpressionController from '@controllers/ListingExpressionController';
import UpdateController from '@controllers/UpdateController';


// Start the server
export const server = new App(
  [
    new ListingsController(),
    new ListingExpressionController(),
    new UpdateController(),
  ],
);

init();

async function init() {
  try {
    server.listen();
  } catch (error) {
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  }
}
