module.exports = (sequelize, DataTypes) => {
    const Secret = sequelize.define("Secret", {
        terminalCode: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        route: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        hasNoPrerequisites: {
            type: DataTypes.BOOLEAN,
        }
    }, {
        timestamps: false,
        tableName: "secrets"
    });

    Secret.associate = (models) => {
        Secret.hasMany(models.PrerequisiteCode, {foreignKey: "prerequisiteId", as: "prerequisite"})
    }

    return Secret;
}