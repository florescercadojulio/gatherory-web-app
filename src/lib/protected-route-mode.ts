/** Account-level templates do not require or select an active event/workspace. */
export function isTemplateAuthoringPath(pathname: string) {
  return pathname === '/blueprints' || pathname.startsWith('/blueprints/')
}
