import { DataTypes, Model } from "sequelize";
import { sequelize } from "@models/model";
import { Options, Attribute } from 'sequelize-decorators'


@Options({
    sequelize: sequelize,
    modelName: 'Job',
    tableName: 'jobs',
    schema: 'properties'
})
export default class Job extends Model {
    // Table Fields
    @Attribute({
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    public id: number;

    @Attribute({
        type: DataTypes.INTEGER
    })
    public status: number;

    @Attribute({
        type: DataTypes.TEXT
    })
    public payload: string;

    @Attribute({
        type: DataTypes.TEXT
    })
    public result: string;

    @Attribute({
        type: DataTypes.TEXT
    })
    public error: string;

}
