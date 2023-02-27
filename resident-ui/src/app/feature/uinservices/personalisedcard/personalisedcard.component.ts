import { Component, OnInit, OnDestroy } from "@angular/core";
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";
import { Router } from "@angular/router";
import Utils from 'src/app/app.utils';
import { AppConfigService } from 'src/app/app-config.service';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { MatDialog } from '@angular/material';
import { saveAs } from 'file-saver';
import { InteractionService } from "src/app/core/services/interaction.service";
import { HttpResponse } from '@angular/common/http';
import { AuditService } from "src/app/core/services/audit.service";
import moment from 'moment';

@Component({
  selector: "app-personalisedcard",
  templateUrl: "personalisedcard.component.html",
  styleUrls: ["personalisedcard.component.css"],
})
export class PersonalisedcardComponent implements OnInit, OnDestroy {
  langJSON: any;
  popupMessages: any;
  subscriptions: Subscription[] = [];
  schema: any;
  langCode: string = "";
  userInfo: any;
  buildHTML: any;
  dataDisplay: any = {};
  clickEventSubscription: Subscription;
  message: string;
  formatData: any;
  nameFormatValues: string[];
  addressFormatValues: string[];
  eventId: any;
  givenNameBox: boolean = false;
  downloadBtnDisabled: boolean = true;
  valuesSelected: any = [];

  constructor(private interactionService: InteractionService, private dialog: MatDialog, private appConfigService: AppConfigService, private dataStorageService: DataStorageService, private translateService: TranslateService, private router: Router, private auditService: AuditService) {
    // this.clickEventSubscription = this.interactionService.getClickEvent().subscribe((id)=>{
    //   if(id === "downloadPersonalCard"){
    //     this.convertpdf()
    //   }

    // })
  }

  async ngOnInit() {
    this.langCode = localStorage.getItem("langCode");

    this.translateService.use(localStorage.getItem("langCode"));

    this.translateService
      .getTranslation(localStorage.getItem("langCode"))
      .subscribe(response => {
        this.langJSON = response;
        this.popupMessages = response;
      });

    this.dataStorageService
      .getConfigFiles("sharewithpartner")
      .subscribe((response) => {
        this.schema = response["identity"];
        this.schema.forEach(data =>{
          this.valuesSelected.push(data.attributeName)
        })
      });
    this.getUserInfo();
    this.getMappingData()
  }

  getMappingData() {
    this.dataStorageService
      .getMappingData()
      .subscribe((response) => {
        this.formatData = { "Address Format": response["identity"]["fullAddress"]["value"].split(","), "Name Format": response["identity"]["name"]["value"].split(","), "Date Format": response["identity"]["dob"]["value"].split(",") }
      })
  }

  getUserInfo() {
    this.dataStorageService
      .getUserInfo('personalized-card')
      .subscribe((response) => {
        this.userInfo = response["response"];
      });
  }

  captureCheckboxValue($event: any, data: any, type: any) {
    this.buildHTML = "";
    let row = "";
    let datadisplay = "";
    let rowImage = "";
    if (type === "datacheck") {
      if (data.attributeName.toString() in this.dataDisplay) {
        delete this.dataDisplay[data.attributeName];
      } else {
        let value = "";
        if (typeof this.userInfo[data.attributeName] === "string") {
          if (this.userInfo[data.attributeName]) {
            value = this.userInfo[data.attributeName];
          } else {
            value = "Not Available"
          }
        } else {
          if (this.userInfo[data.attributeName] === undefined || this.userInfo[data.attributeName].length < 1) {
            value = "Not Available"
          } else {
            value = this.userInfo[data.attributeName][0].value;
          }
        }
        this.dataDisplay[data.attributeName] = [];
        this.dataDisplay[data.attributeName].push({ "label": data.label[this.langCode], "value": value });
      }
      this.schema = this.schema.map(item => {
        if (item.attributeName === data.attributeName) {
          let newItem = { ...item, checked: !item.checked }
          return newItem
        } else {
          return item
        }
      })
    } else {
      if (!data.formatRequired) {
        let value;
        if (this.dataDisplay[data.attributeName][0].value === this.userInfo[type]) {
          value = this.userInfo[data.attributeName];
        } else {
          value = this.userInfo[type]
        }
        delete this.dataDisplay[data.attributeName];
        this.dataDisplay[data.attributeName] = [];
        this.dataDisplay[data.attributeName].push({ "label": data.label[this.langCode], "value": value });
      } else {
        this.schema =  this.schema.map(eachItem =>{
          if(data['attributeName'] === eachItem['attributeName']){
            eachItem['formatOption'][this.langCode].forEach(item =>{
              if(item.value === type['value']){
              return  item['checked'] = !item['checked']
              }else{
              return  item['checked'] = false
              }
            })
          }
          return eachItem
        })
        let value = "";
        let find = function(array, name) {
          return array.some(function(object) {
            return object.label === name;
          });
        };
        if(find(this.dataDisplay[data.attributeName], type.value)){
          this.dataDisplay[data.attributeName].forEach((value, index) => {     
            if(value.label === type.value){
              this.dataDisplay[data.attributeName].splice(index,1);
            }
          });
        }else{
          if (typeof this.userInfo[data.attributeName] === "string") {
            value = moment(this.userInfo[data.attributeName]).format(type.value);
            delete this.dataDisplay[data.attributeName];
            this.dataDisplay[data.attributeName] = [];
            this.dataDisplay[data.attributeName].push({ "label": data.label[this.langCode], "value": value });
          } else {
            let value = ""
            if(type["value"] !== 'fullAddress'){
              value =  typeof this.userInfo[type["value"]] !== 'string' ? this.userInfo[type["value"]][0].value : this.userInfo[type["value"]];
            }else{
              value = this.userInfo[data.attributeName][0].value;
            }
            this.dataDisplay[data['attributeName']][0]['value'] = value
            // this.dataDisplay[data.attributeName] = { "attributeName": data.label[this.langCode], "isMasked": false, "format": type["value"], "value": value };
            // if(type.value !== "fullName"){
            //   if(type.value !== "fullAddress"){
            //     if(this.userInfo[type.value]){
            //       value = this.userInfo[type.value][0].value;
            //       console.log(value)
            //     }
            //     this.dataDisplay[data.attributeName].push({ "label": type.value, "value": value });
            //   }
            // }            
          }          
        }
      }
    }

    if (Object.keys(this.dataDisplay).length >= 3) {
      this.downloadBtnDisabled = false
    } else {
      this.downloadBtnDisabled = true
    }
    for (const key in this.dataDisplay) {
      if (key === "photo") {
        rowImage = "<tr><td><img src=' " + this.dataDisplay[key][0].value + "' alt='' style='margin-left:48%;' width='70px' height='70px'/></td></tr>";
      } else {
        datadisplay = "";
        this.dataDisplay[key].forEach((value, index) => {     
          if(datadisplay){
            datadisplay = datadisplay+", "+value.value;
          }else{
            datadisplay = value.value;
          }
        });
        row = row + "<tr><td style='font-weight:600;'>" + this.dataDisplay[key][0].label + ":</td><td>" + datadisplay + "</td></tr>";
      }
    }  
    this.buildHTML = `<html><head></head><body><table>` + rowImage + row + `</table></body></html>`;
    $event.stopPropagation();
  }

  downloadFile() {
    this.auditService.audit('RP-032', 'Download personalised card', 'RP-Download personalised card', 'Download personalised card', 'User clicks on "download" button on download personalised card page');
    this.convertpdf();
  }

  convertpdf() {
    let self = this;
    const request = {
      "id": this.appConfigService.getConfig()["mosip.resident.download.personalized.card.id"],
      "version": this.appConfigService.getConfig()["resident.vid.version.new"],
      "requesttime": Utils.getCurrentDate(),
      "request": {
        "html": btoa(this.buildHTML),
        "attributes": Object.keys(this.dataDisplay)
      }
    };
    this.dataStorageService
      .convertpdf(request)
      .subscribe(data => {
        // var fileName = self.userInfo.fullName+".pdf";
        let contentDisposition = data.headers.get('content-disposition');
        this.eventId = data.headers.get("eventid")
        if (contentDisposition) {
          try {
            var fileName = ""
            console.log("contentDisposition" + contentDisposition)
            if (contentDisposition) {
              const fileNameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
              const matches = fileNameRegex.exec(contentDisposition);
              if (matches != null && matches[1]) {
                fileName = matches[1].replace(/['"]/g, '');
                console.log(matches[1].replace(/['"]/g, '') + "filename")
              }
            }
            console.log("headers" + JSON.stringify(data.headers))
            saveAs(data.body, fileName);
            this.showMessage()
          } catch (error) {
            console.log(error)
          }
        }

      },
        err => {
          console.error(err);
        });
  }



  conditionsForPersonalisedCard() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '650px',
      data: {
        case: 'conditionsForPersonalisedCard',
        description: this.popupMessages.genericmessage.personalisedcardConditions,
        btnTxt: this.popupMessages.genericmessage.sendButton
      }
    });
    return dialogRef;
  }

  showMessage() {
    this.message = this.popupMessages.genericmessage.personalisedcardMessages.downloadedSuccessFully.replace("$eventId", this.eventId)
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '650px',
      data: {
        case: 'MESSAGE',
        title: this.popupMessages.genericmessage.successLabel,
        clickHere: this.popupMessages.genericmessage.clickHere,
        eventId: this.eventId,
        passwordCombinationHeading: this.popupMessages.genericmessage.passwordCombinationHeading,
        passwordCombination: this.popupMessages.genericmessage.passwordCombination,
        message: this.message,
        btnTxt: this.popupMessages.genericmessage.successButton
      }
    });
    return dialogRef;
  }

  showErrorPopup(message: string) {
    this.dialog
      .open(DialogComponent, {
        width: '650px',
        data: {
          case: 'MESSAGE',
          title: this.popupMessages.genericmessage.errorLabel,
          message: message,
          btnTxt: this.popupMessages.genericmessage.successButton
        },
        disableClose: true
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  onItemSelected(item: any) {
    this.router.navigate([item]);
  }
}

