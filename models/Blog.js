module.exports = (sequelize, DataTypes) => {
    const Blog = sequelize.define("Blog", {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        content: {
            type: DataTypes.TEXT("medium"),
            allowNull: false,
        },
        blogType: {
            type: DataTypes.ENUM("blog", "snippet", "draft"),
            defaultValue:"draft"
        }
    }, {
        timestamps: true,
        tableName: "blogs"
    });

    return Blog;
}