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
              // lens: {
              //   args: [3, 320],
              //   msg: "Email must be between 3 and 320 characters"
              // }
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
          type: DataTypes.STRING,
          trim: true,
          required: true,
          validate: {
            customLen(value)
            {
              if (value.length < 6) {
                throw new Error("Password length must be at least 6 characters");
              } else if (value.length > 256) {
                throw new Error("Password length must be less than 256 characters");
              }
            }
            
          }
        },
        privateKey: {
          type: DataTypes.STRING,
        },
        publicKey: {
          type: DataTypes.STRING,
        },
        emailVerified: {
          type: DataTypes.BOOLEAN,
        },
        emailToken: {
          type: DataTypes.STRING,
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
    }
    
    return User;
}

