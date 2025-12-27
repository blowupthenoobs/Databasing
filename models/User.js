const validator = require("validator")

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User", {
        username: {
          type: DataTypes.STRING,
          allowNull: false
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
              isEmail: (value) => {
                if(!validator.isEmail(value)) {
                  throw new Error("Email is invalid");
                }
              },
              customLen(value) {
                if(value.length < 3) {
                  throw new Error("Email must be at least 3 characters")
                }
                if(value.length > 320) {
                  throw new Error("Email must be less than 320 characters")
                }
              }
          }
        },
        password: {
          type: DataTypes.STRING(512),
          trim: true,
          required: true,
        },
        passwordResetToken: {
          type: DataTypes.STRING,
        },
        passwordLastModified: {
          type: DataTypes.DATE
        }
          
    }, {
      timestamps: true,
    });

    User.associate = (models) => {
      User.hasMany(models.Token, { foreignKey: "userId", as: "tokens"})
      User.hasMany(models.PrerequisiteCode, { foreignKey: "foundPrerequisites", as: "discoveredPaths"})
    }
    
    return User;
}

