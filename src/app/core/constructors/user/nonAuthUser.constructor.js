

  
    NonAuthUser.$inject = ['User'];
export default function NonAuthUser(User) {

      function NonAuthUser(userData) {
        User.call(this, userData);
      }
      NonAuthUser.prototype = Object.create(User.prototype);
      NonAuthUser.prototype.constructor = User;

      return NonAuthUser;
    }

