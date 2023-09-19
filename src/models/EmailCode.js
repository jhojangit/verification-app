const { DataTypes } = require('sequelize');
const sequelize = require('../utils/connection');

const Emailcode = sequelize.define('emailcode', {
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },

});

module.exports = Emailcode;