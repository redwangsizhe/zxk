import { testTreePage } from './../testTree/test-tree';
import { Component, Input, Output, EventEmitter, ViewChild, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { Content, NavController, AlertController, ModalController, Events, LoadingController } from 'ionic-angular';
import { HttpService } from '../../services/http-service/http.service';
import { FileUploader } from 'ng2-file-upload';
import { ParamService } from '../../services/param-service/param.service';
import { QuestionRecModalPage } from '../question-rec-modal/question-rec-modal';
import { ToastService } from '../../services/toast-service/toast.service';
import Cookies from 'js-cookie';
declare var window: any;
declare var CONFIG: any;
@Component({
    selector: 'page-person-weike-list',
    templateUrl: 'person-weike-list.html'
})
export class PersonWeikeList {
    @ViewChild(Content) content: Content;
    wkShow: any;
    fromIphone: number;
    valueDate: any;
    isFirst: boolean = true;
    page: number = 1;
    @Output() pWkList = new EventEmitter;
    weikeList: any[] = [];
    dirId: any;
    catalogId: any;
    catalogUrl: any;
    wkLength: any;
    weikeId: any;
    uploaderWk: boolean = true;
    isRefresh: any;
    isInfinite: any;
    isLoading: any;
    catalogDirId: any;
    isEvents: any;
    isWindow: boolean;
    overShow: boolean[] = [false];
    @ViewChildren('fileName') fileName;
    uploader: FileUploader = new FileUploader({
        url: CONFIG.SERVERURL + '/CourseApi/uploadFile',
        headers: [],
        itemAlias: 'file',
        method: 'POST'
    });
    constructor(public navCtrl: NavController,
        public alertCtrl: AlertController,
        public httpService: HttpService,
        public modalCtrl: ModalController,
        public events: Events,
        public loadingCtrl: LoadingController,
        private toastService: ToastService,
        public changeRef: ChangeDetectorRef,
        public paramService: ParamService
    ) {
        this.fromIphone = window.platformType;

        window.pier.js('biz.resource.refreshWeike', () => {
            this.isWindow = true;
            // setTimeout(() => {
            this.getWeikeList(this, 1);
            // }, 10);

        });
    }
    ngDoCheck() {
        if (this.fileName && this.fileName._results) {
            for (let i = 0; i < this.fileName._results.length; i++) {
                if (this.fileName._results[i].nativeElement.clientHeight > 60) {
                    this.overShow.splice(i, 1, true);
                } else {
                    this.overShow.splice(i, 1, false);
                }
            }
        }
    }
    /**查询微课列表 */
    getWeikeList(catalogDirId, page: number, scrollEvent?) {
        if (page == 1) {
            //防止页面切换之后查询第二页页数出错
            this.page = page;
        }
        this.catalogDirId = catalogDirId;
        this.dirId = this.catalogDirId.dirId;
        this.catalogId = this.catalogDirId.fatherId + "," + this.catalogDirId.childrenId;
        this.catalogUrl = this.catalogDirId.fatherDirName + "," + this.catalogDirId.childrenDirName;

        this.httpService.postService('/resource/person/getWeikeList/' + this.dirId, {
            "pageSize": 20,
            "pageIndex": page
        }, (response) => {
            // if (response && response.content) {
            this.weikeList = response.content.content;
            // this.wkShow.push.apply(this.wkShow, this.weikeList);
            if (page == 1) {
                this.wkShow = this.weikeList;
            } else {
                this.wkShow = this.wkShow.concat(response.content.content);
            }
            this.wkLength = response.content.totalElements
            this.pWkList.emit(this.wkLength);

            // this.content.resize();
            if (scrollEvent) {
                scrollEvent.complete();
            }

            this.isLoading = false;
            this.isRefresh = false;
            this.isInfinite = false;
            // if (this.isWindow) {
            //     this.isWindow = false;
            //     this.changeRef.markForCheck();
            //     this.changeRef.detectChanges();
            // }
            // }
        });
    }

    doRefresh(refresher?) {
        if (this.isRefresh || this.isInfinite) {
            return false;
        }
        setTimeout(() => {
            this.isRefresh = true;
            this.getWeikeList(this.catalogDirId, 1, refresher);

            setTimeout(() => {
                if (this.isRefresh) {
                    refresher.complete();
                    this.isRefresh = false;
                }
            }, 5000)
        }, 100);
    }
    doInfinite(infiniteScroll) {
        if (this.isRefresh || this.isInfinite) {
            return false;
        }
        setTimeout(() => {
            this.isInfinite = true;
            this.getWeikeList(this.catalogDirId, ++this.page, infiniteScroll);
            setTimeout(() => {
                if (this.isInfinite) {
                    infiniteScroll.complete();
                    this.isInfinite = false;
                }
            }, 5000)
        }, 100);
    }
    /**
     * 上传微课
     */
    addwk() {
        if (this.fromIphone == 0) {
            this.httpService.getService('/teacher/action', {
                "from": 'IMPORT-WEIKE-TIP-PC',
                "update": false
            }, (response) => {
                if (response.content && response.content.status == 'N') {
                    this.showAlert();
                    this.isFirst = false;
                    this.httpService.getService('/teacher/action', {
                        "from": 'IMPORT-WEIKE-TIP-PC',
                        "update": true
                    }, (response) => { });
                } else {
                    this.isFirst = false;
                }
            });
        }
    }

    selectedFileOnChanged() {
        this.events.subscribe("back:mp4", (status) => {
            this.events.unsubscribe("back:mp4");
            this.uploader;
            this.uploader.getNotUploadedItems();
            if (this.uploader && this.uploader.getNotUploadedItems() && this.uploader.getNotUploadedItems().length > 0) {
                let file = this.uploader.getNotUploadedItems()[0];
                this.uploader.removeFromQueue(file);
            }
            this.events.publish('back:mp4', '');
        });
        let file;
        if (this.uploader.getNotUploadedItems() && this.uploader.getNotUploadedItems().length > 0) {
            file = this.uploader.getNotUploadedItems()[0];
            this.uploaderWk = false;
            if (file.file.size / 1024 / 1024 > 50) {
                this.toastService.setToast('资源大小超过50M');
                this.uploader.removeFromQueue(file);
                setTimeout(() => {
                    this.uploaderWk = true;
                }, 20);
                return false
            }
        } else {
            return false;
        }
        let wkName = file.file.name;
        let videoType = file.file.name.substr(file.file.name.length - 3, file.file.name.length - 1);
        wkName = wkName.split(".mp4")[0];
        if (videoType == "mp4") {
            this.paramService.set("uploadWk", {
                "resType": "WEIKE",
                "saveType": "0",
                "weikeName": wkName,
                "catalogId": this.catalogId,
                "catalogUrl": this.catalogUrl,
            });
            let modal = this.modalCtrl.create(QuestionRecModalPage, {
                'addWeikeData': JSON.stringify({
                    "resType": "WEIKE",
                    "saveType": "0",
                    "weikeName": wkName,
                    "personCatalogId": this.catalogId,
                    "personCatalogUrl": this.catalogUrl,
                    'isPcWeike': true
                })
            });
            setTimeout(() => {
                this.uploaderWk = true;
            }, 20);
            modal.present();
        } else {
            setTimeout(() => {
                this.uploaderWk = true;
            }, 20);
            this.toastService.setToast('只支持mp4格式');
            this.uploader.removeFromQueue(file);
            return false;
        }

        if (!this.isEvents) {
            this.isEvents = true;
            this.events.subscribe("events:weikeData", (data) => {
                // this.uploaderWk = true;
                let loading = this.loadingCtrl.create({
                    content: '上传中...'
                });
                loading.present();
                setTimeout(() => {
                    loading.dismiss();
                }, 5000)
                // for (let i = 0; i < this.uploader.getNotUploadedItems().length; i++) {

                //     this.uploader.uploadItem(file);
                // }
                let file = this.uploader.getNotUploadedItems()[this.uploader.getNotUploadedItems().length - 1];
                this.uploader.uploadItem(file);
                this.uploader.onSuccessItem = (item: any, response: string, status: number, headers: any) => {
                    this.weikeId = JSON.parse(response).content;
                    this.httpService.postService('/resource/person/addWeike', {
                        "fileName": data.weikeName,
                        "weikeFileId": this.weikeId,
                        "weikeType": "VIDEO",
                        "dirId": data.personCatalogId,
                        "knowledgePointIds": data.knowledgeIds,
                        "schoolDirId": data.schoolCatalogId
                    }, (response) => {

                        if (response && response.content) {
                            loading.dismiss();
                            this.toastService.setToast("上传成功");
                            this.getWeikeList(this.catalogDirId, 1);
                            this.events.publish("events:uploadWeike", {
                                "type": "ssc"
                            });
                        } else {
                            loading.dismiss();
                            this.toastService.setToast("上传失败");
                        }
                    });
                };

            })
        }

    }
    showAlert() {
        let alert = this.alertCtrl.create({
            cssClass: "uploadAlert",
            message: '目前只支持上传MP4格式，需要编码为：AVC(H264),比特率小于500KB/秒，大小不超过50M。若上传不成功，请尝试用“格式工厂”软件将原视频转成MP4格式。',
            buttons: [
                {
                    text: '点击下载格式工厂',
                    cssClass: 'down',
                    handler: data => {
                        window.open("http://down.pcgeshi.com/FormatFactory_setup.exe");
                    }
                },
                {
                    cssClass: 'know',
                    text: '我知道了',
                }
            ]
        });
        alert.present();
    }

    /**
     * 点击录制微课
     */
    recWk() {
        window.pier.native('biz.weike.record', '', (response) => {
        });
        window.setStorage();
    }
    /**
     * 点击进入微课详情
     * @param w 
     */
    wkClick(w) {
        let viewPoint = '1-2-4-5-6';
        if (this.fromIphone == 0) {
            viewPoint = '1-4-5-6';
        }
        if (w.status == 'PENDING_AUDIT') {
            viewPoint = '4-5';
        }
        // if (w.status == 'AUDIT_FAIL') {
        //     let alert = this.alertCtrl.create({
        //         title: '拒绝原因：',
        //         subTitle: w.rejectReason,
        //         buttons: ['关闭']
        //     });
        //     alert.present();
        // } else {
        // if (window.isAndroid == 1) {
        if (window.isPc) {
            window.location.href = CONFIG.ZUOYESERVICE + "/weike/detail?view=hd&weikeId=" + w.weikeId + "&view-point=" + viewPoint;
        } else {
            window.pier.native('biz.weike.detail', {
                "id": w.weikeId,
                'viewPoint': viewPoint
            }, (response) => {
            }, (code, msg) => {
            });
            window.setStorage();
        }

        // } else {
        //     window.location.href = CONFIG.ZUOYESERVICE + "/weike/detail?view=hd&weikeId=" + w.weikeId + "&view-point=1-2-4-5-6";
        // }

        // }

    }

    //查看拒绝原因
    checkFailReason(w) {
        let alert = this.alertCtrl.create({
            title: '拒绝原因：',
            message: w.rejectReason,
            buttons: ['关闭'],
            cssClass: "rejectReason",
        });
        alert.present();
    }


    ionViewWillLeave() {
        this.events.unsubscribe("events:weikeData");
    }

    ionViewWillEnter() {
        this.doRefresh();
    }
}