'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProfilerData = sequelize.define('ProfilerData', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    core: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    task: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'ProfilerData',
    timestamps: false,
  });

  return ProfilerData;
};
