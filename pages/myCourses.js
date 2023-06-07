const { ipcMain, dialog } = require("electron");
const DownloadManager = require("../lib/DownloadManager");
const FileManager = require("../lib/FileManager");
const Page = require("../lib/Page");
const Course = require("../models/Course");
const User = require("../models/User");
const { showError } = require("../utils/log");

class MyCourses extends Page{

    myCourse_list = [];

    async onDidMount(){

        ipcMain.handle("myCourses:view_course", this.viewCourse);
        ipcMain.handle("myCourses:sort_mode_selected", this.sortModeSelected);
        ipcMain.handle("myCourses:select_course_store_dir", this.selectCourseStoreDir);
        ipcMain.handle("myCourses:delete_course_files", this.deleteCourseFiles);

        this.myCourse_list = Course.findAll();
        let user = User.findOne({id:1});
        if(user){
            this.sort_mode = user.sort_mode;
        }
        if(!this.sort_mode){
            this.sort_mode = "sm_newest";
        }

        this.mainWindow.webContents.send("myCourses:my_courses_list", {list:this.myCourse_list, sort_mode:this.sort_mode});
    }

    onWillUnmount(){

        ipcMain.removeHandler("myCourses:view_course", this.viewCourse);
        ipcMain.removeHandler("myCourses:sort_mode_selected", this.sortModeSelected);
        ipcMain.removeHandler("myCourses:select_course_store_dir", this.selectCourseStoreDir);
        ipcMain.removeHandler("myCourses:delete_course_files", this.deleteCourseFiles);
    }

    viewCourse = (event, pk)=>{

        let course = Course.findOne({pk});

        this.router.openPage("player", course);
    }

    sortModeSelected = (event, sort_mode)=>{

        this.sort_mode = sort_mode;

        User.update({id:1}, {sort_mode});
    }

    selectCourseStoreDir = (event, pk)=>{

        let course = Course.findOne({pk});

        if(!course){

            showError("myCourses-1", "selectCourseStoreDir: course with pk:"+pk+" not found!");
            return;
        }

        let options = {
            title : "Select Course Files Directory", 
            defaultPath : course.store_dir,
            properties: ['openDirectory'],
        }
        
        dialog.showOpenDialog(this.mainWindow, options).then(async (res) => {

            if(!res.canceled && res?.filePaths && res.filePaths[0] && course.store_dir!=res.filePaths[0]){

                let selected_path = res.filePaths[0];

                Course.update({pk}, {store_dir: selected_path});

                let sync_res = await Course.sync();

                if(sync_res.error){

                    showError("myCourses-2", "selectCourseStoreDir: error on Course.sync : "+ sync_res.error);
                    return;
                }

                let dlm = DownloadManager.getDownloadManager();

                let delete_res = await dlm.deleteCourseDownloads(course.pk);

                if(delete_res.error){

                    showError("myCourses-3", "selectCourseStoreDir: error on deleteCourseDownloads : "+ delete_res.error);
                    return;
                }

                this.mainWindow.webContents.send("myCourses:select_course_store_dir_done", selected_path);

            }else{

                this.mainWindow.webContents.send("myCourses:select_course_store_dir_done", course.store_dir);
            }
        });
    }

    deleteCourseFiles = async(event, pk)=>{

        let dlm = DownloadManager.getDownloadManager();

        let clean_res = await dlm.cleanCourseTempFiles(pk);

        if(clean_res.error){

            showError("myCourses-4", clean_res.error);
            return;
        }

        let delete_dls_res = await dlm.deleteCourseDownloads(pk);

        if(delete_dls_res.error){

            showError("myCourses-5", delete_dls_res.error);
            return;
        }

        let del_res = FileManager.getFileManager().deleteCourseContents(pk);

        if(del_res.error){

            showError("myCourses-6", del_res.error);
            return;
        }

        this.mainWindow.webContents.send("myCourses:delete_course_files_done");
    };
}

module.exports = MyCourses;