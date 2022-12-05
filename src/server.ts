import 'module-alias/register';
import App from './app';
import ListingsController from '@controllers/ListingsController';
import ListingExpressionController from '@controllers/ListingExpressionController';


// Start the server
const app = new App(
  [
    new ListingsController(),
    new ListingExpressionController(),
  ],
);

init();

async function init() {
  try {
    app.listen();
  } catch (error) {
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  }
}
