module.exports = (sequelize, DataTypes) => {
    const PrerequisiteCode = sequelize.define("PrerequisiteCode", {
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    }, {
        timestamps: false,
        tableName: "prerequisiteCodes"
    });

    PrerequisiteCode.associate = (models) => {
        PrerequisiteCode.hasMany(models.User, {foreignKey: "secretId", as: "secret"})
        PrerequisiteCode.hasMany(models.User, {foreignKey: "userId", as: "user"})
    }

    return PrerequisiteCode;
}