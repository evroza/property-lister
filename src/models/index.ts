import { sequelize } from "./model";
import Listing from '@models/Listing';
import ListingExpression from '@models/ListingExpression';
import Job from '@models/Job';


export const models = {
    Listing,
    ListingExpression,
    Job
};
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

export {
    sequelize,
    Listing,
    ListingExpression,
    Job
}