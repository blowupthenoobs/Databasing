

module.exports = (sequelize, DataTypes) => {
    const Token = sequelize.define("Token", {
        token: {
            type: DataTypes.CHAR(64),
            allowNull: false
        },
        uuid: {
            type: DataTypes.STRING,
            allowNull: false
        },
        time: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM("permanent", "temporary"),
            allowNull: false
        },
    }, {
        timestamps: true,
        tableName: "tokens"
    });

    Token.associate = (models) => {
        Token.belongsTo(models.User, {foreignKey: "userId", as: "user"})
    }

    return Token;
}