import { DataTypes, Model } from "sequelize";
import { sequelize } from "@models/model";
import { Options, Attribute } from 'sequelize-decorators'


@Options({
    sequelize: sequelize,
    tableName: 'listing_expressions',
    modelName: 'ListingExpression',
    schema: 'properties'
})
export default class ListingExpression extends Model {
    // Table Fields
    @Attribute({
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    public id: number;

    @Attribute({
        type: DataTypes.INTEGER,
        allowNull: false
    })
    public listingId: number;

    @Attribute({
        type: DataTypes.JSON,
        allowNull: false
    })
    public meta: string;

    @Attribute({
        type: DataTypes.INTEGER
    })
    public parentExpression: number;
    
    @Attribute({
        type: DataTypes.ENUM('0', '1'),
        allowNull: false,
        defaultValue: '0'
    })
    public isDeleted: string;

    @Attribute({
        type: DataTypes.ENUM('0', '1'),
        allowNull: false,
        defaultValue: '0'
    })
    public isEdit: string;  

    // Relationships
    static associate(models) {
        this.belongsTo(models.ListingExpression, { foreignKey: 'parentExpression' });
        this.belongsTo(models.Listing, { foreignKey: 'listingId' });
    }
}
