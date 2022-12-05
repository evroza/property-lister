import { DataTypes, Model } from "sequelize";
import { sequelize } from "@models/model";
import { Options, Attribute } from 'sequelize-decorators'


@Options({
    sequelize: sequelize,
    modelName: 'Listing',
    tableName: 'listings',
    schema: 'properties'
})
export default class Listing extends Model {
    // Table Fields
    @Attribute({
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    public id: number;

    @Attribute({
        type: DataTypes.STRING,
        allowNull: false
    })
    public propertyId: string;

    @Attribute({
        type: DataTypes.STRING,
        allowNull: false
    })
    public hash: string;

    @Attribute({
        type: DataTypes.INTEGER
    })
    public activeExpression: number;

    @Attribute({
        type: DataTypes.ENUM('0', '1'),
        allowNull: false,
        defaultValue: '0'
    })
    public isDeleted: string;

    // Relationships
    static associate(models) {
        this.hasMany(models.ListingExpression, {as :'Expressions',foreignKey:'listingId'});
        this.belongsTo(models.ListingExpression, {as :'ActiveExpression',foreignKey:'activeExpression'});
    }
}
