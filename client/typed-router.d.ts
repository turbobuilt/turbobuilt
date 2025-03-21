/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'vue-router'

  /**
   * Route name map generated by unplugin-vue-router
   */
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>,
    '/accept-invitation/': RouteRecordInfo<'/accept-invitation/', '/accept-invitation', Record<never, never>, Record<never, never>>,
    '/dashboard/': RouteRecordInfo<'/dashboard/', '/dashboard', Record<never, never>, Record<never, never>>,
    '/emailConfiguration/EmailConfiguration': RouteRecordInfo<'/emailConfiguration/EmailConfiguration', '/emailConfiguration/EmailConfiguration', Record<never, never>, Record<never, never>>,
    '/item/': RouteRecordInfo<'/item/', '/item', Record<never, never>, Record<never, never>>,
    '/item/[guid]': RouteRecordInfo<'/item/[guid]', '/item/:guid', { guid: ParamValue<true> }, { guid: ParamValue<false> }>,
    '/item/components/components/components/ItemPropertyTypeSelector': RouteRecordInfo<'/item/components/components/components/ItemPropertyTypeSelector', '/item/components/components/components/ItemPropertyTypeSelector', Record<never, never>, Record<never, never>>,
    '/item/components/components/components/ItemPropertyValueInput': RouteRecordInfo<'/item/components/components/components/ItemPropertyValueInput', '/item/components/components/components/ItemPropertyValueInput', Record<never, never>, Record<never, never>>,
    '/item/components/components/ItemPropertyComponent': RouteRecordInfo<'/item/components/components/ItemPropertyComponent', '/item/components/components/ItemPropertyComponent', Record<never, never>, Record<never, never>>,
    '/item/components/FileInputOld': RouteRecordInfo<'/item/components/FileInputOld', '/item/components/FileInputOld', Record<never, never>, Record<never, never>>,
    '/item/components/ItemProperties': RouteRecordInfo<'/item/components/ItemProperties', '/item/components/ItemProperties', Record<never, never>, Record<never, never>>,
    '/item/components/SelectWebsites': RouteRecordInfo<'/item/components/SelectWebsites', '/item/components/SelectWebsites', Record<never, never>, Record<never, never>>,
    '/item/components/WebsitePageItemEditor': RouteRecordInfo<'/item/components/WebsitePageItemEditor', '/item/components/WebsitePageItemEditor', Record<never, never>, Record<never, never>>,
    '/item-import-task/': RouteRecordInfo<'/item-import-task/', '/item-import-task', Record<never, never>, Record<never, never>>,
    '/item-import-task/[guid]': RouteRecordInfo<'/item-import-task/[guid]', '/item-import-task/:guid', { guid: ParamValue<true> }, { guid: ParamValue<false> }>,
    '/item-property-type/': RouteRecordInfo<'/item-property-type/', '/item-property-type', Record<never, never>, Record<never, never>>,
    '/item-property-type/[guid]': RouteRecordInfo<'/item-property-type/[guid]', '/item-property-type/:guid', { guid: ParamValue<true> }, { guid: ParamValue<false> }>,
    '/login/': RouteRecordInfo<'/login/', '/login', Record<never, never>, Record<never, never>>,
    '/login/components/GoogleLoginButton': RouteRecordInfo<'/login/components/GoogleLoginButton', '/login/components/GoogleLoginButton', Record<never, never>, Record<never, never>>,
    '/organization/': RouteRecordInfo<'/organization/', '/organization', Record<never, never>, Record<never, never>>,
    '/organization/[guid]': RouteRecordInfo<'/organization/[guid]', '/organization/:guid', { guid: ParamValue<true> }, { guid: ParamValue<false> }>,
    '/purchase/': RouteRecordInfo<'/purchase/', '/purchase', Record<never, never>, Record<never, never>>,
    '/purchase/[guid]': RouteRecordInfo<'/purchase/[guid]', '/purchase/:guid', { guid: ParamValue<true> }, { guid: ParamValue<false> }>,
    '/upload/': RouteRecordInfo<'/upload/', '/upload', Record<never, never>, Record<never, never>>,
    '/vscode/': RouteRecordInfo<'/vscode/', '/vscode', Record<never, never>, Record<never, never>>,
    '/vscode/VSCode': RouteRecordInfo<'/vscode/VSCode', '/vscode/VSCode', Record<never, never>, Record<never, never>>,
    '/website/': RouteRecordInfo<'/website/', '/website', Record<never, never>, Record<never, never>>,
    '/website/[guid]': RouteRecordInfo<'/website/[guid]', '/website/:guid', { guid: ParamValue<true> }, { guid: ParamValue<false> }>,
    '/website/components/WebsiteProperties': RouteRecordInfo<'/website/components/WebsiteProperties', '/website/components/WebsiteProperties', Record<never, never>, Record<never, never>>,
    '/website/components/WebsiteWebsitePagesList': RouteRecordInfo<'/website/components/WebsiteWebsitePagesList', '/website/components/WebsiteWebsitePagesList', Record<never, never>, Record<never, never>>,
    '/website-page-template/': RouteRecordInfo<'/website-page-template/', '/website-page-template', Record<never, never>, Record<never, never>>,
    '/website-page-template/[guid]': RouteRecordInfo<'/website-page-template/[guid]', '/website-page-template/:guid', { guid: ParamValue<true> }, { guid: ParamValue<false> }>,
    '/website-page-template/client-components/FileInput': RouteRecordInfo<'/website-page-template/client-components/FileInput', '/website-page-template/client-components/FileInput', Record<never, never>, Record<never, never>>,
    '/website-page-template/components/ComponentListItem': RouteRecordInfo<'/website-page-template/components/ComponentListItem', '/website-page-template/components/ComponentListItem', Record<never, never>, Record<never, never>>,
    '/website-page-template/components/ComponentsList': RouteRecordInfo<'/website-page-template/components/ComponentsList', '/website-page-template/components/ComponentsList', Record<never, never>, Record<never, never>>,
    '/website-page-template/components/EditWorkspaceFileModal': RouteRecordInfo<'/website-page-template/components/EditWorkspaceFileModal', '/website-page-template/components/EditWorkspaceFileModal', Record<never, never>, Record<never, never>>,
    '/website-page-template/components/RenderBlock': RouteRecordInfo<'/website-page-template/components/RenderBlock', '/website-page-template/components/RenderBlock', Record<never, never>, Record<never, never>>,
    '/website-page-template/components/SelectWebsitesComponent': RouteRecordInfo<'/website-page-template/components/SelectWebsitesComponent', '/website-page-template/components/SelectWebsitesComponent', Record<never, never>, Record<never, never>>,
    '/workspace/': RouteRecordInfo<'/workspace/', '/workspace', Record<never, never>, Record<never, never>>,
    '/workspace/[guid]': RouteRecordInfo<'/workspace/[guid]', '/workspace/:guid', { guid: ParamValue<true> }, { guid: ParamValue<false> }>,
    '/workspace/clientComponents/PaypalCheckout': RouteRecordInfo<'/workspace/clientComponents/PaypalCheckout', '/workspace/clientComponents/PaypalCheckout', Record<never, never>, Record<never, never>>,
    '/workspace/components/MonacoVue': RouteRecordInfo<'/workspace/components/MonacoVue', '/workspace/components/MonacoVue', Record<never, never>, Record<never, never>>,
    '/workspace/components/TreeViewFlat': RouteRecordInfo<'/workspace/components/TreeViewFlat', '/workspace/components/TreeViewFlat', Record<never, never>, Record<never, never>>,
    '/workspace/components/TreeViewNested/TreeView': RouteRecordInfo<'/workspace/components/TreeViewNested/TreeView', '/workspace/components/TreeViewNested/TreeView', Record<never, never>, Record<never, never>>,
    '/workspace/components/TreeViewNested/TreeViewItem': RouteRecordInfo<'/workspace/components/TreeViewNested/TreeViewItem', '/workspace/components/TreeViewNested/TreeViewItem', Record<never, never>, Record<never, never>>,
    '/workspace/components3/MonacoVue': RouteRecordInfo<'/workspace/components3/MonacoVue', '/workspace/components3/MonacoVue', Record<never, never>, Record<never, never>>,
    '/workspace/default': RouteRecordInfo<'/workspace/default', '/workspace/default', Record<never, never>, Record<never, never>>,
    '/workspace/vscode-web/VsCodeWeb': RouteRecordInfo<'/workspace/vscode-web/VsCodeWeb', '/workspace/vscode-web/VsCodeWeb', Record<never, never>, Record<never, never>>,
  }
}
