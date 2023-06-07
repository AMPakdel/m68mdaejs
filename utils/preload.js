const { contextBridge, ipcRenderer } = require('electron')

// All the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

contextBridge.exposeInMainWorld('electronAPI',{

  //main
  webContentDidMount: () => ipcRenderer.invoke('main:web_content_did_mount'),
  webContentWillUnmount: () => ipcRenderer.invoke('main:web_content_will_unmount'),
  notEnoughStorageSpace: (cb) => ipcRenderer.on("main:not_enough_space", cb),

  //route
  changePage: (cb) => ipcRenderer.on('route:change_page', cb),
  pageDidMount: (data) => ipcRenderer.invoke('route:page_did_mount', data),
  pageWillUnmount: (data) => ipcRenderer.invoke('route:page_will_unmount', data),

  //menu
  openMenuPage: (data) => ipcRenderer.invoke('menu:open_menu_page', data),
  MenuOnNotification: (cb) => ipcRenderer.on('menu:on_notification_change', cb),
  MenuGetNotifications: (data) => ipcRenderer.invoke('menu:get_notifications', data),
  
  //splash
  failedConnection: (cb) => ipcRenderer.on('splash:failed_connection', cb),
  retryConnection: (data) => ipcRenderer.invoke('splash:retry_connection', data),
  showUpdateModal: (cb) => ipcRenderer.on("splash:show_update_modal", cb),
  opUpdateUrl: (data) => ipcRenderer.invoke('splash:open_update_url', data),
  continueWithoutUpdate: (data) => ipcRenderer.invoke('splash:continue_without_update', data),

  //addCourse
  addCourseSetDir: (cb) => ipcRenderer.on("addCourse:set_store_path", cb),
  addCourseSelectDir: (data) => ipcRenderer.invoke("addCourse:open_dir_select", data),
  addCourseHelpLink: (data) => ipcRenderer.invoke("addCourse:open_help_link", data),
  addCourseConfirm: (data) => ipcRenderer.invoke("addCourse:confirm", data),
  addCourseConfirmError: (cb) => ipcRenderer.on("addCourse:confirm_error", cb),

  //myCourses
  myCoursesGetList: (cb) => ipcRenderer.on("myCourses:my_courses_list", cb),
  myCourseViewCourse: (data) => ipcRenderer.invoke("myCourses:view_course", data),
  myCourseSortModeSelected: (data) => ipcRenderer.invoke("myCourses:sort_mode_selected", data),
  myCourseSelectDir: (data) => ipcRenderer.invoke("myCourses:select_course_store_dir", data),
  myCourseSelectDirDone: (cb) => ipcRenderer.on("myCourses:select_course_store_dir_done", cb),
  myCourseDeleteFiles: (data) => ipcRenderer.invoke("myCourses:delete_course_files", data),
  myCourseDeleteFilesDone: (cb) => ipcRenderer.on("myCourses:delete_course_files_done", cb),
  
  //player
  playerSetPlaylist: (cb) => ipcRenderer.on("player:play_list_data", cb),
  playerContentSelect: (data) => ipcRenderer.invoke("player:content_select", data),
  playerOpenDocument: (data) => ipcRenderer.invoke("player:open_document", data),
  playerOpenCreatorSite: (data) => ipcRenderer.invoke("player:open_creator_site", data),
  playerOpenCoursePage: (data) => ipcRenderer.invoke("player:open_course_page", data),
  playerLoadPlayer: (data) => ipcRenderer.invoke("player:load_player", data),
  playerLoadPlayerDone: (cb) => ipcRenderer.on("player:load_player_done", cb),
  playerReleasePlayer: (data) => ipcRenderer.invoke("player:release_player", data),
  playerReleasePlayerDone: (cb) => ipcRenderer.on("player:release_player_done", cb),

  //downloads
  downloadsSetList: (cb) => ipcRenderer.on("downloads:set_list", cb),
  downloadsShowContent: (data) => ipcRenderer.invoke("download:show_content", data),

  //download
  downloadProgress: (cb) => ipcRenderer.on("download:progress", cb),
  downloadError: (cb) => ipcRenderer.on("download:error", cb),
  downloadEnd: (cb) => ipcRenderer.on("download:finished", cb),
  downloadStart: (data) => ipcRenderer.invoke("download:start", data),
  downloadDidStart: (cb) => ipcRenderer.on("download:did_start", cb),
  downloadPause: (data) => ipcRenderer.invoke("download:pause", data),
  downloadDidPause: (cb) => ipcRenderer.on("download:did_pause", cb),
  downloadCancel: (data) => ipcRenderer.invoke("download:cancel", data),
  downloadDidCancel: (cb) => ipcRenderer.on("download:did_cancel", cb),

  //settings
  settingsOpenHelpLink: (data) => ipcRenderer.invoke("settings:open_help_link", data),
  settingsSendReportMessage: (data) => ipcRenderer.invoke("settings:send_report_message", data),
  settingsDidSendReportMessage: (cb) => ipcRenderer.on("settings:did_send_report_message", cb),

});

window.addEventListener('DOMContentLoaded', () => {
  
})