import { HttpService } from './../../services/http-service/http.service';
import { Component } from '@angular/core';
import { NavController, AlertController, ModalController, Events, NavParams } from 'ionic-angular';
import { QuestionRecModalPage } from '../question-rec-modal/question-rec-modal';
import { DomSanitizer } from '@angular/platform-browser';
import { ParamService } from '../../services/param-service/param.service';

declare var window: any;
declare var CONFIG: any;
@Component({
    selector: 'page-question-rec',
    templateUrl: 'question-rec.html'
})
export class QuestionRecPage {
    recUrl: any;
    openSave: boolean = false;
    editType: any;
    src: any;
    typeIndex: number;
    saveData: any;
    isSaveEvents: boolean = true;
    catalogId: any;
    catalogUrl: any;
    isFirst: boolean = true;
    saveDir: any;
    update: boolean = false;
    constructor(
        public navCtrl: NavController,
        private alertCtrl: AlertController,
        public modalCtrl: ModalController,
        public events: Events,
        public navparams: NavParams,
        private sanitizer: DomSanitizer,
        public paramService: ParamService,
        public httpService: HttpService
    ) {

        let _this = this;
        window.pier.js('biz.resource.showSaveByEditQuestion', (param, callback) => {
            _this.saveSrc();
        });
        this.editType = this.navparams.get("editType");
        if (this.editType == "edit" && this.navparams.get("urlData")) {
            this.catalogId = this.navparams.get("urlData").personCatalogId;
            this.catalogUrl = this.navparams.get("urlData").personCatalogUrl;
        } else {
            this.catalogId = this.navparams.get("catalogId");
            this.catalogUrl = this.navparams.get("catalogUrl");
        }
        if (this.navparams.get("saveData")) {
            this.saveData = JSON.parse(this.navparams.get("saveData"));
        }
        if (this.navparams.get("dirInfo")) {
            this.saveDir = this.navparams.get("dirInfo");
        }
        this.initEvents();
        this.src = this.sanitizer.bypassSecurityTrustResourceUrl(CONFIG['PLATFORM-SERVICE'] + '/gnw-school-web/question/edit.html');
    }

    initOk() {
        let isInit;
        window.pier.iframe('myiframe', 'init', {
            type: this.typeIndex,
            data: this.saveData
        }, (msg) => {
            isInit = true;
        });
        setTimeout(() => {
            if (!isInit) {
                window.pier.iframe('myiframe', 'init', {
                    type: this.typeIndex,
                    data: this.saveData
                }, (msg) => {
                    isInit = true;
                });
            }
        }, 2000)
    }

    ionViewDidEnter() {
        if (this.isFirst && this.editType == "edit") {
            this.typeIndex = this.navparams.get("questionType") + 1;
            this.initOk();
            this.isFirst = false;
        } else if (this.editType != "edit") {
            this.typeIndex = this.navparams.get("questionType") + 1;
            this.initOk();
        }
    }


    saveSrc() {
        //         saveType
        // resType		     资源类型      String  传"QUESTION
        //  "
        // subject		     学科	   String
        // stage		     学段	   String
        // schoolId             学校ID        String
        // this.events.publish("",{
        //     ''
        //     "resType":"QUESTION",
        //     "saveType":"0",
        //     "subject":"1",
        //     "stage":"1",
        //     "schoolId":"121",
        //     'onSave':(data)=>{
        //         window.pier.iframe('my','biz.resource','save',data,()=>{

        //         });
        //     }
        // })
        let modal = this.modalCtrl.create(QuestionRecModalPage);
        modal.present();
        if (this.editType == "edit") {
            if (window.roleType != "0") {
                if (this.catalogId.split(",")[1] != this.saveDir.dirId && this.catalogId.split(",")[0] != this.saveDir.dirId) {
                    this.catalogId = this.catalogId.split(",")[0] + "," + this.saveDir.dirId;
                }
                if (this.catalogUrl.split(",")[1] != this.saveDir.dirname && this.catalogUrl.split(",")[0] != this.saveDir.dirname) {
                    this.catalogUrl = this.catalogUrl.split(",")[0] + "," + this.saveDir.dirname;
                }
            }
            this.paramService.set('sub:editContent', JSON.stringify({
                "saveType": '1', //0录题
                "weikeName": '',
                "resType": "QUESTION",
                "personCatalogUrl": this.catalogUrl,
                "schoolCatalogUrl": "",
                "personCatalogId": this.catalogId,
                "schoolCatalogId": "",
                "knowledgePoints": this.saveData.knowledgePoints,
                "difficulty": this.saveData.difficulty,
                "stage": this.saveData.stage,
                "subject": this.saveData.subject
            }))
            this.events.subscribe("events:editContent", (data) => {
                this.events.unsubscribe("events:editContent");
                let qtkpIdList = [];
                for (let i = 0; i < this.saveData.knowledgePoints.length; i++) {
                    qtkpIdList.push(this.saveData.knowledgePoints[i].id)
                }
                let postData: any;
                if (window.roleType == "0") {
                    postData = {
                        'stage': window.stage || 1,
                        'subject': window.subject,
                        'dirId': data.personCatalogId,
                        'schoolDirlId': data.schoolCatalogId == undefined ? "" : data.schoolCatalogId,
                        'qtkpIdList': data.knowledgePoints,
                        'id': this.saveData.id,
                        'difficulty': data.difficulty,
                        "repository": "SCHOOL",
                        "isManage": "manage"
                    };
                } else {
                    postData = {
                        'stage': window.stage || 1,
                        'subject': window.subject,
                        'dirId': data.personCatalogId,
                        'schoolDirlId': data.schoolCatalogId == undefined ? "" : data.schoolCatalogId,
                        'qtkpIdList': data.knowledgePoints,
                        'id': this.saveData.id,
                        'difficulty': data.difficulty,
                    };
                }

                window.pier.iframe('myiframe', 'biz.questionEditor.getData', {
                }, (iframeData) => {
                    if (!this.update) {
                        this.update = true;
                        if (iframeData.search('&questionType=choice') >= 0 || iframeData.search('questionType=choice&') >= 0) {
                            this.httpService.postService('/resource/quiz/updateChoice', postData, (response) => { this.update = false }, '', iframeData);
                        } else if (iframeData.search('&questionType=multichoice') >= 0 || iframeData.search('questionType=multichoice&') >= 0) {
                            this.httpService.postService('/resource/quiz/updateMultiChoice ', postData, (response) => { this.update = false }, '', iframeData);
                        } else if (iframeData.search('&questionType=judge') >= 0 || iframeData.search('questionType=judge&') >= 0) {
                            this.httpService.postService('/resource/quiz/updateJudge', postData, (response) => { this.update = false }, '', iframeData);
                        } else if (iframeData.search('&questionType=reading') >= 0 || iframeData.search('questionType=reading&') >= 0) {
                            this.httpService.postService('/resource/quiz/updateReadComprehension', postData, (response) => { this.update = false }, '', iframeData);
                        } else if (iframeData.search('&questionType=cloze') >= 0 || iframeData.search('questionType=cloze&') >= 0) {
                            this.httpService.postService('/resource/quiz/updateQuestionsCloze', postData, (response) => { this.update = false }, '', iframeData);
                        } else if (iframeData.search('&questionType=blank') >= 0 || iframeData.search('questionType=blank&') >= 0) {
                            this.httpService.postService('/resource/quiz/updateFillQuestion', postData, (response) => { this.update = false }, '', iframeData);
                        } else if (iframeData.search('&questionType=answer') >= 0 || iframeData.search('questionType=answer&') >= 0) {
                            this.httpService.postService('/resource/quiz/updateSubject', postData, (response) => { this.update = false }, '', iframeData);
                        } else if (iframeData.search('&questionType=listen') >= 0 || iframeData.search('questionType=listen&') >= 0) {
                            this.httpService.postService('/resource/quiz/updateListen', postData, (response) => { this.update = false }, '', iframeData);
                        }
                    }
                });
                //直接在这里回传数据
            });
        } else {
            this.paramService.set('sub:saveResource', JSON.stringify({
                "saveType": '0', //0录题
                "weikeName": '',
                "resType": "QUESTION",
                "personCatalogUrl": this.catalogUrl,
                "schoolCatalogUrl": "",
                "personCatalogId": this.catalogId,
                "schoolCatalogId": "",
                "knowledgePoints": ""
            }));
            if (this.isSaveEvents) {
                this.isSaveEvents = false;
                this.events.subscribe("events:saveResource", (data) => {
                    let postData = {
                        'stage': window.stage,
                        'subject': window.subject,
                        'dirId': data.personCatalogId,
                        'schoolDirlId': data.schoolCatalogId,
                        'qtkpIdList': data.knowledgePoints,
                        'difficulty': data.difficulty,
                    };
                    window.pier.iframe('myiframe', 'biz.questionEditor.getData', {
                    }, (iframeData) => {
                        // questionType=choice
                        if (iframeData.search('&questionType=choice') >= 0 || iframeData.search('questionType=choice&') >= 0) {
                            this.httpService.postService('/resource/quiz/addChoice', postData, (response) => { }, '', iframeData);
                        } else if (iframeData.search('&questionType=multichoice') >= 0 || iframeData.search('questionType=multichoice&') >= 0) {
                            this.httpService.postService('/resource/quiz/addMultiChoice', postData, (response) => { }, '', iframeData);
                        } else if (iframeData.search('&questionType=judge') >= 0 || iframeData.search('questionType=judge&') >= 0) {
                            this.httpService.postService('/resource/quiz/addJudge', postData, (response) => { }, '', iframeData);
                        } else if (iframeData.search('&questionType=reading') >= 0 || iframeData.search('questionType=reading&') >= 0) {
                            this.httpService.postService('/resource/quiz/addReadComprehension', postData, (response) => { }, '', iframeData);
                        } else if (iframeData.search('&questionType=cloze') >= 0 || iframeData.search('questionType=cloze&') >= 0) {
                            this.httpService.postService('/resource/quiz/addQuestionsCloze', postData, (response) => { }, '', iframeData);
                        } else if (iframeData.search('&questionType=blank') >= 0 || iframeData.search('questionType=blank&') >= 0) {
                            this.httpService.postService('/resource/quiz/addFillQuestion', postData, (response) => { }, '', iframeData);
                        } else if (iframeData.search('&questionType=answer') >= 0 || iframeData.search('questionType=answer&') >= 0) {
                            this.httpService.postService('/resource/quiz/addSubject', postData, (response) => { }, '', iframeData);
                        } else if (iframeData.search('&questionType=listen') >= 0 || iframeData.search('questionType=listen&') >= 0) {
                            this.httpService.postService('/resource/quiz/addListen', postData, (response) => { }, '', iframeData);
                        }
                    });
                });
            }
        }
    }


    //点击保存录题
    postQuestion(data) {

    }
    //web录题成功弹窗
    addSec() {
        this.openSave = false;
        let alert = this.alertCtrl.create({
            title: '保存成功',
            message: '一元二次方程试题一',
            cssClass: 'addSec',
            buttons: [
                {
                    cssClass: "img",
                },
                {
                    cssClass: "back",
                    text: '返回试题列表',
                    handler: () => {
                        this.navCtrl.pop();
                    }
                },
                {
                    cssClass: "continue",
                    text: '继续录题',
                    handler: () => {
                        alert.dismiss;
                    }
                },
                // {
                //     cssClass: "print",
                //     text: '打印点阵纸',
                //     handler: () => {
                //         window.location.href = CONFIG.ZUOYESERVICE + "/weike/previewBlankPdf?source=BLANK&pageSize=1&token=" + window.token;
                //     }
                // }
            ]
        });
        alert.present();
    }

    initEvents() {
        if (this.editType != "edit") {
            this.events.subscribe("status:dismiss", (status) => {
                if (status = "dismiss") {
                    this.events.unsubscribe("status:dismiss");
                    this.navCtrl.pop();
                    this.paramService.set("status", "");

                }
            });
        }
    }

    ionViewWillEnter() {
        if (this.editType == "edit") {
            if (this.paramService.get("status") == "dismiss") {
                this.navCtrl.pop();
                this.paramService.set("status", "");
                this.events.publish("status:deleted", "deleted");
            }
        }
    }

    ionViewWillLeave() {
        if (this.editType != "edit") {
            this.events.unsubscribe("status:dismiss");
        }
        this.events.unsubscribe("events:saveResource");
    }

}