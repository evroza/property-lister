import { sequelize } from "./model";
import Listing from '@models/Listing';
import ListingExpression from '@models/ListingExpression';


const models = {
    Listing,
    ListingExpression
};
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

export {
    sequelize,
    Listing,
    ListingExpression
}