const { User, Role, Permission } = require('../Api/Models/Association');

module.exports = {
  assignPermissionsToRole: async (roleId, permissionIds) => {
    try {
      const role = await Role.findByPk(roleId);
      if (!role) {
        console.error(`Role with ID ${roleId} not found.`);
        return;
      }

      const permissions = await Permission.findAll({
        where: { id: permissionIds },
      });

      if (permissions.length === 0) {
        console.error(`No permissions found for IDs: ${permissionIds}`);
        return;
      }

      await role.addPermissions(permissions);
      console.log(`Permissions assigned to role ID ${roleId}:`, permissionIds);
    } catch (error) {
      console.error('Error assigning permissions:', error);
    }
  },
};
