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
        PrerequisiteCode.belongsToMany(models.Secret, {through: "secretPrerequisite", as: "secrets"})
        PrerequisiteCode.belongsToMany(models.User, {through: "foundPrerequisites", as: "users"})
    }

    return PrerequisiteCode;
}