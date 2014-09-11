/**
 * AuthorizationPolicy
 *
 * Verifications:
 * 1. User is logged in
 * 2. User has Permission to perform method on Model
 * 3. User has Permission to perform method on Attribute (if applicable)
 * 4. User is satisfactorily related to the Object's owner (if applicable)
 *
 * This policy verifies #1-3 here, before any controller is invoked. However
 * it is not generally possible to determine ownership relationship until after
 * the object has been queried. Verification of #4 
 *
 * @param {Object}   req
 * @param {Object}   res
 * @param {Function} next
 */
module.exports = function AuthorizationPolicy (req, res, next, error) {
  if (!req.isAuthenticated()) {
    return res.badRequest(req.__('401.not.authenticated'));
  }
  var user = req.user;
  var model = req.model;
  var method = PermissionService.getMethodFromRequest(req);

  Permission.find({
      model: model.id,
      role: _.pluck(user.roles, 'id')
    })
    .then(function (permissions) {
      if (permissions.length === 0) {
        error = req.__('401.permission.missing', user.username, model.name);
        sails.log('AuthorizationPolicy:', msg);
        return res.badRequest(error);
      }

      var valid = PermissionService.isValid(method, permissions);
      if (!valid) {
        error = req.__('401.permission.denied', user.username, method, model.name);
        sails.log('AuthorizationPolicy:', msg);
        return res.badRequest(error);
      }
      next();
    })
    .catch(next);
};
