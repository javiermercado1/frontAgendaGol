export const rootPaths = {
  homeRoot: '/',
  authRoot: 'auth',
  errorRoot: 'error',
};

export default {
  home: `${rootPaths.homeRoot}`,
  login: `/${rootPaths.authRoot}/login`,
  signup: `/${rootPaths.authRoot}/sign-up`,
  404: `/${rootPaths.errorRoot}/404`,
};
