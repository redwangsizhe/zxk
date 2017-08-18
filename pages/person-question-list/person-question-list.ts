import { Component, Output, EventEmitter, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Content, NavController, ModalController, Platform, NavParams, ViewController, AlertController } from 'ionic-angular';
import { HttpService } from '../../services/http-service/http.service';
import { ResourceQuestionDetailPage } from "../resource-question-detail/resource-question-detail";
import { QuestionRecPage } from "../question-rec/question-rec";
import { ParamService } from '../../services/param-service/param.service';
declare var window: any;
@Component({
  selector: 'page-person-question-list',
  templateUrl: 'person-question-list.html'
})
export class PersonQuestionList {
  @ViewChild(Content) content: Content;
  stInfo: any;
  stInfos: any[] = [];
  stShow: any;
  fromIphone: number;
  stType: any[] = ["选择题", '判断题', '阅读理解', '听力题', '解答题', '填空题', '完形填空'];
  @Output() pStList = new EventEmitter;
  dirId: any;
  page: number = 1;
  stLength: any;
  catalogId: any;
  catalogUrl: any;
  isRefresh: any;
  isInfinite: any;
  catalogDirId: any;
  constructor(public navCtrl: NavController,
    public modalCtrl: ModalController,
    public httpService: HttpService,
    private alertCtrl: AlertController,
    public changeRef: ChangeDetectorRef,
    public paramService: ParamService,
  ) {
    this.fromIphone = window.platformType;

  }


  //查询我的资源
  getQueryQuizList(catalogDirId, page: number, scrollEvent?) {
    this.catalogDirId = catalogDirId;
    this.dirId = this.catalogDirId.dirId;
    this.catalogId = this.catalogDirId.fatherId + "," + this.catalogDirId.childrenId;
    this.catalogUrl = this.catalogDirId.fatherDirName + "," + this.catalogDirId.childrenDirName;
    this.httpService.getService('/resource/quiz/queryQuizList', {
      "repository": 'PERSON',
      "dirId": this.dirId,
      "dirType": "NORMAL",
      "pageSize": 20,
      "page": page,
      // "ownerId":"userid"
    }, (response) => {
      if (!response.content || !response.content.content) {
        response.content = {
          content: [],
          totalElements: 0
        }
      }
      if (page == 1) {
        this.stShow = response.content.content;
      } else {
        this.stShow = this.stShow.concat(response.content.content)
      }
      // if (response && response.content) {

      // this.stShow.push.apply(this.stShow, response.content.content);
      this.stLength = response.content.totalElements;
      this.pStList.emit(this.stLength);
      if (scrollEvent) {
        scrollEvent.complete();
      }
      this.changeRef.markForCheck();
      this.changeRef.detectChanges();

      this.isRefresh = false;
      this.isInfinite = false;
      // this.content.resize();
      // }
    });
  }
  /**
   * web跳转录题界面
   * @param e 
   */
  openModal(e, i) {
    this.navCtrl.push(QuestionRecPage, {
      "editType": "rec",
      'questionType': i,
      "catalogId": this.catalogId,
      "catalogUrl": this.catalogUrl
    });//传录题的值
  }

  doRefresh(refresher?) {
    if (this.isRefresh || this.isInfinite) {
      return false;
    }
    setTimeout(() => {
      this.isRefresh = true;
      this.getQueryQuizList(this.catalogDirId, 1, refresher);
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
      this.getQueryQuizList(this.catalogDirId, ++this.page, infiniteScroll);
      setTimeout(() => {
        if (this.isInfinite) {
          infiniteScroll.complete();
          this.isInfinite = false;
        }
      }, 5000)
    }, 100);

  }
  //跳转试题详情
  toDetailsQuestion(s) {

    this.navCtrl.push(ResourceQuestionDetailPage, {
      "id": s.id, "fromPage": "PersonQuestionList", "status": s.status, "urlData": {
        'personCatalogUrl': this.catalogUrl,
        'personCatalogId': this.catalogId
      }
    });
  }
  //查看拒绝理由
  checkFailReason(s) {
    this.httpService.getService('/resource/quiz/quizReject', {
      "id": s.id
    }, (response) => {
      let alert = this.alertCtrl.create({
        cssClass: "rejectReason",
        title: '拒绝原因：',
        message: response.content.rejectReason,
        buttons: ['关闭']
      });
      alert.present();

    });

  }

}