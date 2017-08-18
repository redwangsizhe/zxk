import { Component, ElementRef } from '@angular/core';
import { NavController, AlertController, Platform, Events,NavParams } from 'ionic-angular';
import { SaveResource } from '../save-resource/save-resource';
import { ParamService } from '../../services/param-service/param.service';

@Component({
    selector: 'page-question-rec-modal',
    templateUrl: 'question-rec-modal.html'
})
export class QuestionRecModalPage {
    modalStatus: any;
    isDismiss: boolean;
    constructor(
        public navCtrl: NavController,
        private alertCtrl: AlertController,
        public platform: Platform,
        private el: ElementRef,
        public events: Events,
        public paramService: ParamService,
        public navParams:NavParams
        ) {
        this.isDismiss = false;
        if(this.navParams.get('addWeikeData')){
            this.paramService.set('sub:saveResource',this.navParams.get('addWeikeData'))
        }
        this.navCtrl.push(SaveResource);
        // if(this.navParams.get('addWeikeData')){
        //     console.log(this.navParams.get('addWeikeData'))
        // }
        this.platform.ready().then(() => {
            this.el.nativeElement.parentElement.className += ' page-question-rec-modal-';
        });

    }
    ionViewWillEnter() {
        if (this.isDismiss) {
            this.modalStatus = this.paramService.get("status");
            if (this.modalStatus == "dismiss") {
                this.navCtrl.pop();
                this.events.publish("status:dismiss", "dismiss");
            } else {
                this.navCtrl.pop();
            }
        } else {
            this.isDismiss = true;
        }
    }
}