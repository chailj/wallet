import React from 'react';
import { connect } from 'react-redux'
import {DeviceEventEmitter,StyleSheet,Image,ScrollView,View,Text, TextInput,Platform,Dimensions,ImageBackground,TouchableOpacity,KeyboardAvoidingView,BVLinearGradient} from 'react-native';
import { TabViewAnimated, TabBar, SceneMap } from 'react-native-tab-view';
import moment from 'moment';
import Echarts from 'native-echarts'
import UImage from '../../utils/Img'
import UColor from '../../utils/Colors'
import { Eos } from "react-native-eosjs";
import Header from '../../components/Header'
import Button from  '../../components/Button'
import Constants from '../../utils/Constants'
import ScreenUtil from '../../utils/ScreenUtil'
import { EasyToast } from '../../components/Toast';
import {formatEosQua} from '../../utils/FormatUtil';
import { EasyShowLD } from '../../components/EasyShow'
import Ionicons from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient';
import BaseComponent from "../../components/BaseComponent";
import CountDownReact from '../../components/CountDownReact'
const ScreenWidth = Dimensions.get('window').width;
const ScreenHeight = Dimensions.get('window').height;
var dismissKeyboard = require('dismissKeyboard');
const _index = 0;
var AES = require("crypto-js/aes");
var CryptoJS = require("crypto-js");

@connect(({wallet, vote}) => ({...wallet, ...vote}))
class Resources extends BaseComponent {

    static navigationOptions = { 
        title: "资源管理",
        header:null, 
    };
     
    recordMortgage = () =>{  
        const { navigate } = this.props.navigation;
        navigate('MortgageRecord', {account_name: this.props.navigation.state.params.account_name});
    }  

  // 构造函数  
  constructor(props) { 
    super(props);
    this.state = {
        index: 0,
        routes: [
            { key: '1', title: "CPU/NET" }, 
            { key: '2', title:  "内存" }
        ],
        isMortgage: true, //抵押
        isRedeem: false, //赎回
        isMemory: true, //内存
        isCalculation: false, //计算
        isNetwork: false, //网络
        isBuy: true, // 购买
        isSell: false, // 出售

        isLease: true, // 租赁
        isTransfer: false, // 过户
        LeaseTransfer: 0,
        currency_surplus: '0.00',
        
        Currentprice: '0',
       
        buyRamAmount: "", //购买数量，抵押数量
        sellRamBytes: "", //出售数量，赎回数量
        receiver: this.props.navigation.state.params.account_name, //账户（默认自己）
        init: true,


        show: false, //弹框
        balance: '0', //EOS余额
        password: "", //密码
        errortext: "", //提示语
        logRefreshing: false, //下拉刷新
        cpu_delegateb: "", //抵押cpu
        net_delegateb: "", //抵押net

        ram_available: '0.00', //内存可用
        ram_AlreadyUsed: '0.00', //内存已用
        ram_Percentage: '0%', //内存已用百分比

        cpu_available: '0.00', //计算可用
        cpu_AlreadyUsed: '0.00', //计算已用
        cpu_Percentage: '0%', //计算已用百分比

        net_available: '0.00', //网络可用
        net_AlreadyUsed: '0.00', //网络已用
        net_Percentage: '0%', //网络已用百分比
        
        total_ram_used: '0 GB', //全网已用
        total_ram_reserved: '0 GB', //全网可用
        total_ram_used_Percentage: '0%', //全网已用百分比

        redeem: '0', //计算+网络赎回中EOS
    };
  }

  componentDidMount() {
    try {
        // EasyShowLD.loadingShow();
        //取全网的内存数据
        this.props.dispatch({ type: 'vote/getGlobalInfo', payload: {}, });
       //取内存价格EOS/kb
        this.props.dispatch({ type: 'vote/getqueryRamPrice',  payload: {},
            callback: (data) => {
                if(data == null || data == ''){
                    return;
                }
                this.setState({Currentprice: data});
            }
        });
        this.props.dispatch({ type: 'wallet/getDefaultWallet',
            callback: (data) => {
                this.getAccountInfo();
            }
        });
        this.props.dispatch({ type: 'wallet/info', payload: { address: "1111" },
            callback: () => {
                this.getBalance();
            }
        });
        DeviceEventEmitter.addListener('wallet_info', (data) => {
            this.getBalance();
        });
        DeviceEventEmitter.addListener('updateDefaultWallet', (data) => {
            this.props.dispatch({ type: 'wallet/info', payload: { address: "1111" } });
            this.getBalance();
        });
        DeviceEventEmitter.addListener('eos_balance', (data) => {
            this.setEosBalance(data);
        });
        DeviceEventEmitter.addListener('scan_result', (data) => {
            try {
                if (data.toaccount) {
                    this.setState({
                        receiver: data.toaccount
                    });
                }
            } catch (error) {
                EasyShowLD.loadingClose();
            }
        });
        
    } catch (error) {
        EasyShowLD.loadingClose();
    }
  }

  componentWillUnmount(){
    //结束页面前，资源释放操作
    super.componentWillUnmount();
  }

  getAccountInfo(){
    if(this.state.init){
        this.setState({init: false});
            //EasyShowLD.loadingShow();
        }

    this.props.dispatch({ type: 'vote/getaccountinfo', payload: { page:1,username: this.props.navigation.state.params.account_name},callback: (data) => {
      try {
        //EasyShowLD.loadingClose();
        if(data != null){
            this.setState({ 
                logRefreshing: false,

                total_ram_used: this.props.globaldata.used + 'GB',
                total_ram_reserved: this.props.globaldata.reserved + 'GB',
                total_ram_used_Percentage: this.props.globaldata.used_Percentage + '%',
                

                ram_available: Math.floor(data.ram_usage/1024*100)/100 + 'kb',
                ram_AlreadyUsed: Math.floor((data.total_resources.ram_bytes-data.ram_usage)/1024*100)/100 + 'kb',
                ram_Percentage: ((data.total_resources.ram_bytes-data.ram_usage)/data.total_resources.ram_bytes)*10000/100 + '%',

                cpu_available: Math.floor(data.cpu_limit.available/1024*100)/100 + 'ms',
                cpu_AlreadyUsed: Math.floor(data.cpu_limit.used/1024*100)/100 + 'ms',
                cpu_Percentage: (data.cpu_limit.used/data.cpu_limit.max)*10000/100 + '%',
                
                net_available: Math.floor(data.net_limit.available/1024*100)/100 + 'kb',
                net_AlreadyUsed: Math.floor(data.net_limit.used/1024*100)/100 + 'kb',
                net_Percentage: (data.net_limit.used/data.net_limit.max)*10000/100 + '%',

                redeem: Math.floor(parseFloat(this.props.Resources.refund_request.cpu_amount)+parseFloat(this.props.Resources.refund_request.net_amount)*100)/100
            })
            
        }
       
        // this.setState({ 
        //     ram_available:((data.total_resources.ram_bytes - data.ram_usage) / 1024).toFixed(2),

        // });
            this.getInitialization(); 
      } catch (error) {
          
      }
    } });
    this.props.dispatch({
        type: 'wallet/getBalance', payload: { contract: "eosio.token", account: this.props.navigation.state.params.account_name , symbol: 'EOS' }, callback: (data) => {
            this.setState({ currency_surplus:data && data.data?data.data.replace('EOS', "") :'0',});
    }});
  } 

  getInitialization() {
    if(this.state.isMemory){
        this.goPage('isMemory');
      }else if(this.state.isCalculation){
        this.goPage('isCalculation');
      }else if(this.state.isNetwork){
        this.goPage('isNetwork');
      }else{
      }   
  }

  getBalance() { 
    if (this.props.navigation.state.params != null && this.props.navigation.state.params.account_name != null) {
      this.props.dispatch({
        type: 'wallet/getBalance', payload: { contract: "eosio.token", account: this.props.navigation.state.params.account_name, symbol: 'EOS' }, callback: (data) => {
            this.setEosBalance(data);
        }
      })
    } else {
      this.setState({ balance: '0'})
    }
  }
  
  setEosBalance(data){
    if (data && data.code == '0') {
        if (data.data == "") {
          this.setState({
            balance: '0',
          })
        } else {
          account: this.props.defaultWallet.name,
          this.setState({ balance: data.data.replace("EOS", ""), })
        }
      } else {
        // EasyToast.show('获取余额失败：' + data.msg);
      }
  }

    goPage(current) {
        alert(JSON.stringify(this.props.Resources));
        try {
            if (current == 'isMemory'){
                this.setState({ 
                    tetletext: '内存概况',
                    column_One: (100-this.props.Resources.display_data.ram_usage_percent.replace("%", "")) + '%',
                    column_Two: (100-this.props.Resources.display_data.ram_left_percent.replace("%", "")) + '%',
                    column_Three: (100-this.props.globaldata.used_Percentage) + '%',
                    ContrastOne: this.props.Resources.display_data.ram_usage + '/' + this.props.Resources.display_data.ram_bytes,
                    ContrastTwo: this.props.Resources.display_data.ram_left + '/' + this.props.Resources.display_data.ram_bytes,
                    ContrastThree: this.props.globaldata.used + 'GB/' + this.props.globaldata.total + 'GB',
                    percentageOne: '已用(' + this.props.Resources.display_data.ram_usage_percent + ')',
                    percentageTwo: '剩余(' + this.props.Resources.display_data.ram_left_percent + ')',
                    percentageThree: '全网(' + this.props.globaldata.used_Percentage + '%)',
                })
            }else if (current == 'isCalculation'){
                this.setState({ 
                    tetletext: '计算概况',
                    column_One: (100-this.props.Resources.display_data.cpu_limit_available_percent.replace("%", "")) + '%',
                    column_Two: (100-this.props.Resources.display_data.self_delegated_bandwidth_cpu_weight_percent.replace("%", "")) + '%',
                    column_Three: ((this.props.Resources.refund_request&&this.props.Resources.refund_request.cpu_amount!="0.0000 EOS")?this.falseAlarm(this.props.Resources.display_data.refund_request_cpu_left_second_percent):'100%'),
                    ContrastOne: this.props.Resources.display_data.cpu_limit_available + '/' + this.props.Resources.display_data.cpu_limit_max,
                    ContrastTwo: (this.props.Resources.self_delegated_bandwidth?Math.floor(this.props.Resources.self_delegated_bandwidth.cpu_weight.replace("EOS", "")*100)/100:'0') + '/' + Math.floor(this.props.Resources.total_resources.cpu_weight.replace("EOS", "")*100)/100,
                    ContrastThree: ((this.props.Resources.refund_request&&this.props.Resources.refund_request.cpu_amount!="0.0000 EOS")?this.transferTimeZone(this.props.Resources.refund_request.request_time.replace("T", " ")):'00:00:00'),
                    percentageOne: '剩余(ms)',
                    percentageTwo: '抵押(EOS)',
                    percentageThree: '赎回中('+ (this.props.Resources.refund_request ? Math.floor(this.props.Resources.refund_request.cpu_amount.replace("EOS", "")*100)/100 + 'EOS' : '0.00 EOS') + ')',
                })
            }else if (current == 'isNetwork'){
                this.setState({ 
                    tetletext: '网络概况',
                    column_One: (100-this.props.Resources.display_data.net_limit_available_percent.replace("%", "")) + '%',
                    column_Two: (100-this.props.Resources.display_data.self_delegated_bandwidth_net_weight_percent.replace("%", "")) + '%',
                    column_Three: ((this.props.Resources.refund_request&&this.props.Resources.refund_request.net_amount!="0.0000 EOS")?this.falseAlarm(this.props.Resources.display_data.refund_request_net_left_second_percent):'100%'),
                    ContrastOne: this.props.Resources.display_data.net_limit_available + '/' + this.props.Resources.display_data.net_limit_max,
                    ContrastTwo: (this.props.Resources.self_delegated_bandwidth?Math.floor(this.props.Resources.self_delegated_bandwidth.net_weight.replace("EOS", "")*100)/100:'0') + '/' + Math.floor(this.props.Resources.total_resources.net_weight.replace("EOS", "")*100)/100,
                    ContrastThree: ((this.props.Resources.refund_request&&this.props.Resources.refund_request.net_amount!="0.0000 EOS")?this.transferTimeZone(this.props.Resources.refund_request.request_time.replace("T", " ")):'00:00:00'),
                    percentageOne: '剩余(kb)',
                    percentageTwo: '抵押(EOS)',
                    percentageThree: '赎回中('+ (this.props.Resources.refund_request ? Math.floor(this.props.Resources.refund_request.net_amount.replace("EOS", "")*100)/100 + 'EOS' : '0.00 EOS') + ')',
                })
            }
        } catch (error) {
            
        }
        // else if (current == 'isBuyForOther'){
        //     this.setState({ 
        //         tetletext: '内存交易',
        //         column_One: '0%',
        //         column_Two: '0%',
        //         column_Three: '0%',
        //         ContrastOne: '0.00/0.00',
        //         ContrastTwo: '0.00/0.00',
        //         ContrastThree: '0.00/0.00',
        //         percentageOne: '',
        //         percentageTwo: '',
        //         percentageThree: '',
        //     })
        // } 
        // EasyShowLD.loadingClose();
    }

     // 更新"内存，计算，网络，内存交易"按钮的状态  
     _updateBtnState(currentPressed, array) { 
        if (currentPressed === null || currentPressed === 'undefined' || array === null || array === 'undefined') {  
            return;  
        }  
        let newState = {...this.state};  
        for (let type of array) {  
            if (currentPressed == type) {  
                newState[type] ? {} : newState[type] = !newState[type];  
                this.setState(newState);  
            } else {  
                newState[type] ? newState[type] = !newState[type] : {};  
                this.setState(newState);  
            }  
        } 
        this.goPage(currentPressed);
        this.Initialization();
    }  

    Initialization() {
        this.setState({
            buyRamAmount: "",
            sellRamBytes: "",
            receiver: "",
            delegateb: "",
            undelegateb: "",
            LeaseTransfer: 0,
        })
    }

    // 返回 抵押 赎回
    resourceButton(style, selectedSate, stateType, buttonTitle) {  
        let BTN_SELECTED_STATE_ARRAY = ['isMortgage', 'isRedeem', ];  
        return(  
            <TouchableOpacity style={[style, selectedSate ? {backgroundColor: UColor.tintColor} : {backgroundColor: UColor.mainColor,}]}  onPress={ () => {this._updateBtnState(stateType, BTN_SELECTED_STATE_ARRAY)}}>  
                <Text style={[styles.tabText, selectedSate ? {color: UColor.btnColor} : {color: UColor.arrow}]}>{buttonTitle}</Text>  
            </TouchableOpacity>  
        );  
    }  

     // 更新"自己,他人,租赁,过户"按钮的状态  
     _updateSelectedState(currentPressed, array) {  
        if (currentPressed === null || currentPressed === 'undefined' || array === null || array === 'undefined') {  
            return;  
        }  
        let newState = {...this.state};  
        for (let type of array) {  
            if (currentPressed == type) {  
                newState[type] ? {} : newState[type] = !newState[type];  
                this.setState(newState);  
            } else {  
                newState[type] ? newState[type] = !newState[type] : {};  
                this.setState(newState);  
            }  
        }  
        this.Initialization();
    }  

    // 返回购买,出售
    ownOthersButton(style, selectedSate, stateType, buttonTitle) {    
        let BTN_SELECTED_STATE_ARRAY = ['isBuy', 'isSell'];  
        return(  
        //   <TouchableOpacity style={{flexDirection: 'row', justifyContent: 'center',alignItems: 'center', flex: 1,}} onPress={ () => {this._updateSelectedState(stateType, BTN_SELECTED_STATE_ARRAY)}}>  
        //       <Text style={{fontSize: 16,color: UColor.fontColor}}>{buttonTitle}</Text>  
        //       <View style={{width: 10, height: 10, marginHorizontal: 8, borderRadius: 3, backgroundColor: UColor.riceWhite, alignItems: 'center', justifyContent: 'center',}}>
        //           {selectedSate ?<View style={{width: 8, height: 8, borderRadius: 10, backgroundColor: UColor.tintColor }}/>:null}
        //       </View>
        //   </TouchableOpacity>  
            <TouchableOpacity style={[style, selectedSate ? {backgroundColor: UColor.tintColor} : {backgroundColor: UColor.mainColor,}]}  onPress={ () => {this._updateSelectedState(stateType, BTN_SELECTED_STATE_ARRAY)}}>  
                <Text style={[styles.tabText, selectedSate ? {color: UColor.btnColor} : {color: UColor.arrow}]}>{buttonTitle}</Text>  
            </TouchableOpacity>  
        );  
    }  

    // 返回租赁,过户
    leaseTransferButton(style, selectedSate, stateType, buttonTitle) {    
        let BTN_SELECTED_STATE_ARRAY = ['isLease','isTransfer'];  
        return(  
          <TouchableOpacity style={{flexDirection: 'row', justifyContent: 'flex-start',alignItems: 'center', flex: 1,}} onPress={ () => {this._updateSelectedState(stateType, BTN_SELECTED_STATE_ARRAY)}}>  
              <View style={{width: 10, height: 10, marginHorizontal: 8, borderRadius: 10, backgroundColor: UColor.mainColor, alignItems: 'center', justifyContent: 'center',borderColor: UColor.arrow,borderWidth: 1,}}>
                  {selectedSate ?<View style={{width: 10, height: 10, borderRadius: 10, backgroundColor: UColor.tintColor, borderColor: UColor.tintColor, borderWidth: 1, }}/>:null}
              </View>
              <Text style={{fontSize: 16,color: UColor.fontColor}}>{buttonTitle}</Text>  
          </TouchableOpacity>  
        );  
    }  

    chkAccount(obj) {
        var charmap = '.12345abcdefghijklmnopqrstuvwxyz';
        for(var i = 0 ; i < obj.length;i++){
            var tmp = obj.charAt(i);
            for(var j = 0;j < charmap.length; j++){
                if(tmp == charmap.charAt(j)){
                    break;
                }
            }
            if(j >= charmap.length){
                //非法字符
                obj = obj.replace(tmp, ""); 
                EasyToast.show('请输入正确的账号');
            }
        }
        if (obj == this.props.defaultWallet.account) {
            EasyToast.show('接收账号和自己账号不能相同，请重输');
            obj = "";
        }
        return obj;
    }

    chkPrice(obj) {
        obj = obj.replace(/[^\d.]/g, "");  //清除 "数字"和 "."以外的字符
        obj = obj.replace(/^\./g, "");  //验证第一个字符是否为数字
        obj = obj.replace(/\.{2,}/g, "."); //只保留第一个小数点，清除多余的
        obj = obj
        .replace(".", "$#$")
        .replace(/\./g, "")
        .replace("$#$", ".");
        obj = obj.replace(/^(\-)*(\d+)\.(\d\d\d\d).*$/,'$1$2.$3'); //只能输入四个小数
        var max = 9999999999.9999;  // 100亿 -1
        var min = 0.0000;
        var value = 0.0000;
        try {
        value = parseFloat(obj);
        } catch (error) {
        value = 0.0000;
        }
        if(value < min|| value > max){
        EasyToast.show("输入错误");
        obj = "";
        }
        return obj;
    }

    //转换时间
    transferTimeZone(date){
        // //转换时间
        let timezone = moment(date).add(72,'hours').format('YYYY-MM-DDTHH:mm:ss');
        return  timezone;
    }
    //时间百分比防出错
    falseAlarm(timePercentage){
        let Percentage = timePercentage.replace("%", "")
        let newtimePercentage;
        if(Percentage <= 0){
            newtimePercentage = '0%'
        }else if(Percentage >= 100){
            newtimePercentage = '100%'
        }else{
            newtimePercentage = timePercentage;
        }
        return newtimePercentage
    }

    chkAmountIsZero(amount,errInfo){
        var tmp;
        try {
             tmp = parseFloat(amount);
          } catch (error) {
              tmp = 0;
          }
        if(tmp <= 0){
            EasyToast.show(errInfo);
            return true;
        }
        return false;
    }

    // 购买内存
    buyram = (rowData) => { 
        if(!this.props.defaultWallet){
            EasyToast.show('请先创建钱包');
            return;
        }
        if(this.state.buyRamAmount == ""){
            EasyToast.show('请输入购买金额');
            return;
        }
        if(this.chkAmountIsZero(this.state.buyRamAmount,'请输入购买金额')){
            this.setState({ buyRamAmount: "" })
            return ;
        }
        this. dismissKeyboardClick();
            const view =
            <View style={styles.passoutsource}>
                <TextInput autoFocus={true} onChangeText={(password) => this.setState({ password })} returnKeyType="go" 
                    selectionColor={UColor.tintColor} secureTextEntry={true} keyboardType="ascii-capable" maxLength={Constants.PWD_MAX_LENGTH}
                    style={[styles.inptpass,{color: UColor.tintColor,backgroundColor: UColor.btnColor,borderBottomColor: UColor.baseline}]} 
                    placeholderTextColor={UColor.inputtip} placeholder="请输入密码" underlineColorAndroid="transparent" />
            </View>
            EasyShowLD.dialogShow("请输入密码", view, "确认", "取消", () => {
            if (this.state.password == "" || this.state.password.length < Constants.PWD_MIN_LENGTH) {
                EasyToast.show('密码长度至少4位,请重输');
                return;
            }

            try {
                var bytes_privateKey;
                var plaintext_privateKey;
                var permission = 'active';
                try {
                    var privateKey = this.props.defaultWallet.activePrivate;
                    bytes_privateKey = CryptoJS.AES.decrypt(privateKey, this.state.password + this.props.defaultWallet.salt);
                    plaintext_privateKey = bytes_privateKey.toString(CryptoJS.enc.Utf8);
                    if(plaintext_privateKey == "eostoken"){ // active私钥为空时使用owner私钥
                        bytes_privateKey = CryptoJS.AES.decrypt(this.props.defaultWallet.ownerPrivate, this.state.password + this.props.defaultWallet.salt);
                        plaintext_privateKey = bytes_privateKey.toString(CryptoJS.enc.Utf8);
                        permission = "owner"; 
                    }
                } catch (error) {
                    EasyShowLD.loadingClose();
                    EasyToast.show('密码错误');
                    return;
                }

                if (plaintext_privateKey.indexOf('eostoken') != -1) {
                    plaintext_privateKey = plaintext_privateKey.substr(8, plaintext_privateKey.length);
                    EasyShowLD.loadingShow();
                    if(this.state.isOwn){
                        this.state.receiver = this.props.defaultWallet.account;
                    }
                    Eos.transaction({
                        actions: [
                            {
                                account: "eosio",
                                name: "buyram", 
                                authorization: [{
                                actor: this.props.defaultWallet.account,
                                permission: permission,
                                }], 
                                data: {
                                    payer: this.props.defaultWallet.account,
                                    receiver: this.state.receiver,
                                    quant: formatEosQua(this.state.buyRamAmount + " EOS"),
                                }
                            },
                        ]
                    }, plaintext_privateKey, (r) => {
                        EasyShowLD.loadingClose();
                        if(r.isSuccess){
                            this.getAccountInfo();
                            EasyToast.show("购买成功");
                        }else{
                            if(r.data){
                                if(r.data.code){
                                    var errcode = r.data.code;
                                    if(errcode == 3080002 || errcode == 3080003|| errcode == 3080004 || errcode == 3080005
                                        || errcode == 3081001)
                                    {
                                        this.props.dispatch({type:'wallet/getFreeMortgage',payload:{username:this.props.defaultWallet.account},callback:(resp)=>{ 
                                        if(resp.code == 608)
                                        { 
                                            //弹出提示框,可申请免费抵押功能
                                            const view =
                                            <View style={styles.passoutsource2}>
                                                <Text style={[styles.Explaintext2,{color: UColor.arrow}]}>该账号资源(NET/CPU)不足！</Text>
                                                <Text style={[styles.Explaintext2,{color: UColor.arrow}]}>EosToken官方提供免费抵押功能,您可以使用免费抵押后再进行该操作。</Text>
                                            </View>
                                            EasyShowLD.dialogShow("资源受限", view, "申请免费抵押", "放弃", () => {
                                                
                                            const { navigate } = this.props.navigation;
                                            navigate('FreeMortgage', {});
                                            // EasyShowLD.dialogClose();
                                            }, () => { EasyShowLD.dialogClose() });
                                        }
                                    }});
                                    }
                                }
                                if(r.data.msg){
                                    EasyToast.show(r.data.msg);
                                }else{
                                    EasyToast.show("购买失败");
                                }
                            }else{
                                EasyToast.show("购买失败");
                            }
                        }
                    });
                } else {
                    EasyShowLD.loadingClose();
                    EasyToast.show('密码错误');
                }
            } catch (e) {
                EasyShowLD.loadingClose();
                EasyToast.show('未知异常');
            }
            // EasyShowLD.dialogClose();
        }, () => { EasyShowLD.dialogClose() });
    };
    // 出售内存
    sellram = (rowData) => {
        if(!this.props.defaultWallet){
            EasyToast.show('请先创建钱包');
            return;
        }
        if(this.state.sellRamBytes == ""){
            EasyToast.show('请输入出售内存kb数量');
            return;
        }
        if(this.chkAmountIsZero(this.state.sellRamBytes,'请输入出售内存kb数量')){
            this.setState({ sellRamBytes: "" })
            return ;
        }
        this. dismissKeyboardClick();
            const view =
            <View style={styles.passoutsource}>
                <TextInput autoFocus={true} onChangeText={(password) => this.setState({ password })} returnKeyType="go" 
                    selectionColor={UColor.tintColor} secureTextEntry={true}  keyboardType="ascii-capable" maxLength={Constants.PWD_MAX_LENGTH}
                    style={[styles.inptpass,{color: UColor.tintColor,backgroundColor: UColor.btnColor,borderBottomColor: UColor.baseline}]}  
                    placeholderTextColor={UColor.inputtip} placeholder="请输入密码" underlineColorAndroid="transparent" />
            </View>
            EasyShowLD.dialogShow("请输入密码", view, "确认", "取消", () => {
            if (this.state.password == "" || this.state.password.length < Constants.PWD_MIN_LENGTH) {
                EasyToast.show('密码长度至少4位,请重输');
                return;
            }

            try {
                var bytes_privateKey;
                var plaintext_privateKey;
                var permission = 'active';

                try {
                    var privateKey = this.props.defaultWallet.activePrivate;    
                    bytes_privateKey = CryptoJS.AES.decrypt(privateKey, this.state.password + this.props.defaultWallet.salt);
                    plaintext_privateKey = bytes_privateKey.toString(CryptoJS.enc.Utf8);
                    if(plaintext_privateKey == "eostoken"){ // active私钥为空时使用owner私钥
                        bytes_privateKey = CryptoJS.AES.decrypt(this.props.defaultWallet.ownerPrivate, this.state.password + this.props.defaultWallet.salt);
                        plaintext_privateKey = bytes_privateKey.toString(CryptoJS.enc.Utf8);
                        permission = "owner"; 
                    }
                } catch (error) {
                    EasyShowLD.loadingClose();
                    EasyToast.show('密码错误');
                    return;
                }

                if (plaintext_privateKey.indexOf('eostoken') != -1) {
                    plaintext_privateKey = plaintext_privateKey.substr(8, plaintext_privateKey.length);
                    EasyShowLD.loadingShow();
                    Eos.transaction({
                        actions: [
                            {
                                account: "eosio",
                                name: "sellram", 
                                authorization: [{
                                actor: this.props.defaultWallet.account,
                                permission: permission,
                                }], 
                                data: {
                                    account: this.props.defaultWallet.account,
                                    bytes: (this.state.sellRamBytes * 1024).toFixed(0),
                                }
                            },
                        ]
                    }, plaintext_privateKey, (r) => {
                        EasyShowLD.loadingClose();
                        if(r.isSuccess){
                            this.getAccountInfo();
                            EasyToast.show("出售成功");
                        }else{
                            if(r.data){
                                if(r.data.code){
                                    var errcode = r.data.code;
                                    if(errcode == 3080002 || errcode == 3080003|| errcode == 3080004 || errcode == 3080005
                                        || errcode == 3081001)
                                    {
                                        this.props.dispatch({type:'wallet/getFreeMortgage',payload:{username:this.props.defaultWallet.account},callback:(resp)=>{ 
                                        if(resp.code == 608)
                                        { 
                                            //弹出提示框,可申请免费抵押功能
                                            const view =
                                            <View style={styles.passoutsource2}>
                                                <Text style={[styles.Explaintext2,{color: UColor.arrow}]}>该账号资源(NET/CPU)不足！</Text>
                                                <Text style={[styles.Explaintext2,{color: UColor.arrow}]}>EosToken官方提供免费抵押功能,您可以使用免费抵押后再进行该操作。</Text>
                                            </View>
                                            EasyShowLD.dialogShow("资源受限", view, "申请免费抵押", "放弃", () => {
                                                
                                            const { navigate } = this.props.navigation;
                                            navigate('FreeMortgage', {});
                                            // EasyShowLD.dialogClose();
                                            }, () => { EasyShowLD.dialogClose() });
                                        }
                                    }});
                                    }
                                }
                                if(r.data.msg){
                                    EasyToast.show(r.data.msg);
                                }else{
                                    EasyToast.show("出售失败");
                                }
                            }else{
                                EasyToast.show("出售失败");
                            }
                        }
                    });
                    
                } else {
                    EasyShowLD.loadingClose();
                    EasyToast.show('密码错误');
                }
            } catch (e) {
                EasyShowLD.loadingClose();
                EasyToast.show('未知异常');
            }
            // EasyShowLD.dialogClose();
        }, () => { EasyShowLD.dialogClose() });
    };

    // 抵押
    delegateb = () => {
        if(!this.props.defaultWallet){
            EasyToast.show('请先创建钱包');
            return;
        }
        if ((this.state.delegateb == "")) {
            EasyToast.show('请输入抵押的EOS数量');
            return;
        }
        if(this.chkAmountIsZero(this.state.delegateb,'请输入抵押的EOS数量')){
            this.setState({ delegateb: "" })
            return ;
        }
        this. dismissKeyboardClick();
        const view =
        <View style={styles.passoutsource}>
            <TextInput autoFocus={true} onChangeText={(password) => this.setState({ password })} returnKeyType="go" 
                selectionColor={UColor.tintColor} secureTextEntry={true} keyboardType="ascii-capable" maxLength={Constants.PWD_MAX_LENGTH}
                style={[styles.inptpass,{color: UColor.tintColor,backgroundColor: UColor.btnColor,borderBottomColor: UColor.baseline}]}  
                placeholderTextColor={UColor.inputtip} placeholder="请输入密码" underlineColorAndroid="transparent" />
                <Text style={[styles.inptpasstext,{color: UColor.lightgray}]}>提示：抵押 {this.state.delegateb} EOS</Text>
        </View>
        EasyShowLD.dialogShow("请输入密码", view, "确认", "取消", () => {
            if (this.state.password == "" || this.state.password.length < Constants.PWD_MIN_LENGTH) {
                EasyToast.show('密码长度至少4位,请重输');
                return;
            }

            try {
                var bytes_privateKey;
                var plaintext_privateKey;
                var permission = 'active';

                try {
                    var privateKey = this.props.defaultWallet.activePrivate;
                    bytes_privateKey = CryptoJS.AES.decrypt(privateKey, this.state.password + this.props.defaultWallet.salt);
                    plaintext_privateKey = bytes_privateKey.toString(CryptoJS.enc.Utf8);
                    if(plaintext_privateKey == "eostoken"){ // active私钥为空时使用owner私钥
                        bytes_privateKey = CryptoJS.AES.decrypt(this.props.defaultWallet.ownerPrivate, this.state.password + this.props.defaultWallet.salt);
                        plaintext_privateKey = bytes_privateKey.toString(CryptoJS.enc.Utf8);
                        permission = "owner"; 
                    }
                } catch (error) {
                    EasyShowLD.loadingClose();
                    EasyToast.show('密码错误');
                    return;
                }
                if (plaintext_privateKey.indexOf('eostoken') != -1) {
                    plaintext_privateKey = plaintext_privateKey.substr(8, plaintext_privateKey.length);
                    if(this.state.isOwn){
                        this.state.receiver = this.props.defaultWallet.account;
                    }
                    if(this.state.isOthers && this.state.isTransfer){
                        this.state.LeaseTransfer = 1;
                    }
                    EasyShowLD.loadingShow();
                    // 计算
                    if(this.state.isCalculation){
                        Eos.transaction({
                            actions: [
                                {
                                    account: "eosio",
                                    name: "delegatebw", 
                                    authorization: [{
                                    actor: this.props.defaultWallet.account,
                                    permission: permission,
                                    }], 
                                    data: {
                                        from: this.props.defaultWallet.account,
                                        receiver: this.state.receiver,
                                        stake_net_quantity: formatEosQua("0 EOS"),
                                        stake_cpu_quantity: formatEosQua(this.state.delegateb + " EOS"),
                                        transfer: this.state.LeaseTransfer,
                                    }
                                },
                            ]
                        }, plaintext_privateKey, (r) => {
                            EasyShowLD.loadingClose();
                            if(r.isSuccess){
                                this.getAccountInfo();
                                EasyToast.show("抵押成功");
                            }else{
                                if(r.data){
                                    if(r.data.code){
                                        var errcode = r.data.code;
                                        if(errcode == 3080002 || errcode == 3080003|| errcode == 3080004 || errcode == 3080005
                                            || errcode == 3081001)
                                        {
                                            this.props.dispatch({type:'wallet/getFreeMortgage',payload:{username:this.props.defaultWallet.account},callback:(resp)=>{ 
                                            if(resp.code == 608)
                                            { 
                                                //弹出提示框,可申请免费抵押功能
                                                const view =
                                                <View style={styles.passoutsource2}>
                                                    <Text style={[styles.Explaintext2,{color: UColor.arrow}]}>该账号资源(NET/CPU)不足！</Text>
                                                    <Text style={[styles.Explaintext2,{color: UColor.arrow}]}>EosToken官方提供免费抵押功能,您可以使用免费抵押后再进行该操作。</Text>
                                                </View>
                                                EasyShowLD.dialogShow("资源受限", view, "申请免费抵押", "放弃", () => {
                                                    
                                                const { navigate } = this.props.navigation;
                                                navigate('FreeMortgage', {});
                                                // EasyShowLD.dialogClose();
                                                }, () => { EasyShowLD.dialogClose() });
                                            }
                                        }});
                                        }
                                    }
                                    if(r.data.msg){
                                        EasyToast.show(r.data.msg);
                                    }else{
                                        EasyToast.show("抵押失败");
                                    }
                                }else{
                                    EasyToast.show("抵押失败");
                                }
                            }
                        });
                    // 网络
                    }else if(this.state.isNetwork){
                        Eos.transaction({
                            actions: [
                                {
                                    account: "eosio",
                                    name: "delegatebw", 
                                    authorization: [{
                                    actor: this.props.defaultWallet.account,
                                    permission: permission,
                                    }], 
                                    data: {
                                        from: this.props.defaultWallet.account,
                                        receiver: this.state.receiver,
                                        stake_net_quantity: formatEosQua(this.state.delegateb + " EOS"),
                                        stake_cpu_quantity: formatEosQua("0 EOS"),
                                        transfer: this.state.LeaseTransfer,
                                    }
                                },
                            ]
                        }, plaintext_privateKey, (r) => {
                            EasyShowLD.loadingClose();
                            if(r.isSuccess){
                                this.getAccountInfo();
                                EasyToast.show("抵押成功");
                            }else{
                                if(r.data){
                                    if(r.data.code){
                                        var errcode = r.data.code;
                                        if(errcode == 3080002 || errcode == 3080003|| errcode == 3080004 || errcode == 3080005
                                            || errcode == 3081001)
                                        {
                                            this.props.dispatch({type:'wallet/getFreeMortgage',payload:{username:this.props.defaultWallet.account},callback:(resp)=>{ 
                                            if(resp.code == 608)
                                            { 
                                                //弹出提示框,可申请免费抵押功能
                                                const view =
                                                <View style={styles.passoutsource2}>
                                                    <Text style={[styles.Explaintext2,{color: UColor.arrow}]}>该账号资源(NET/CPU)不足！</Text>
                                                    <Text style={[styles.Explaintext2,{color: UColor.arrow}]}>EosToken官方提供免费抵押功能,您可以使用免费抵押后再进行该操作。</Text>
                                                </View>
                                                EasyShowLD.dialogShow("资源受限", view, "申请免费抵押", "放弃", () => {
                                                    
                                                const { navigate } = this.props.navigation;
                                                navigate('FreeMortgage', {});
                                                // EasyShowLD.dialogClose();
                                                }, () => { EasyShowLD.dialogClose() });
                                            }
                                        }});
                                        }
                                    }
                                    if(r.data.msg){
                                        EasyToast.show(r.data.msg);
                                    }else{
                                        EasyToast.show("抵押失败");
                                    }
                                }else{
                                    EasyToast.show("抵押失败");
                                }
                            }
                        });
                    }
                } else {
                    EasyShowLD.loadingClose();
                    EasyToast.show('密码错误');
                }
            } catch (e) {
                EasyShowLD.loadingClose();
                EasyToast.show('未知异常');
            }
            // EasyShowLD.dialogClose();
        }, () => { EasyShowLD.dialogClose() }); 
    };
    //赎回
    undelegateb = () => { 
        if(!this.props.defaultWallet){
            EasyToast.show('请先创建钱包');
            return;
        }
        if ((this.state.undelegateb == "")) {
            EasyToast.show('请输入赎回的EOS数量');
            return;
        }
        if(this.chkAmountIsZero(this.state.undelegateb,'请输入赎回的EOS数量')){
            this.setState({ undelegateb: "" })
            return ;
        }
        this. dismissKeyboardClick();
            const view =
            <View style={styles.passoutsource}>
                <TextInput autoFocus={true} onChangeText={(password) => this.setState({ password })} returnKeyType="go"  
                    selectionColor={UColor.tintColor} secureTextEntry={true} keyboardType="ascii-capable" maxLength={Constants.PWD_MAX_LENGTH}
                    style={[styles.inptpass,{color: UColor.tintColor,backgroundColor: UColor.btnColor,borderBottomColor: UColor.baseline}]}  
                    placeholderTextColor={UColor.inputtip} placeholder="请输入密码" underlineColorAndroid="transparent" />
                <Text style={[styles.inptpasstext,{color: UColor.lightgray}]}>提示：赎回 {this.state.undelegateb} EOS</Text>
            </View>
    
            EasyShowLD.dialogShow("请输入密码", view, "确认", "取消", () => {
            if (this.state.password == "" || this.state.password.length < Constants.PWD_MIN_LENGTH) {
                EasyToast.show('密码长度至少4位,请重输');
                return;
            }

            try {
                var bytes_privateKey;
                var plaintext_privateKey;
                var permission = 'active';

                try {
                    var privateKey = this.props.defaultWallet.activePrivate;
                    bytes_privateKey = CryptoJS.AES.decrypt(privateKey, this.state.password + this.props.defaultWallet.salt);
                    plaintext_privateKey = bytes_privateKey.toString(CryptoJS.enc.Utf8);
                    if(plaintext_privateKey == "eostoken"){ // active私钥为空时使用owner私钥
                        bytes_privateKey = CryptoJS.AES.decrypt(this.props.defaultWallet.ownerPrivate, this.state.password + this.props.defaultWallet.salt);
                        plaintext_privateKey = bytes_privateKey.toString(CryptoJS.enc.Utf8);
                        permission = "owner"; 
                    }
                } catch (error) {
                    EasyShowLD.loadingClose();
                    EasyToast.show('密码错误');
                    return;
                }
                if (plaintext_privateKey.indexOf('eostoken') != -1) {
                    plaintext_privateKey = plaintext_privateKey.substr(8, plaintext_privateKey.length);
                    if(this.state.isOwn){
                        this.state.receiver = this.props.defaultWallet.account;
                    }
                    EasyShowLD.loadingShow();
                    // 解除抵押
                    if(this.state.isCalculation){
                        Eos.transaction({
                            actions: [
                                {
                                    account: "eosio",
                                    name: "undelegatebw", 
                                    authorization: [{
                                    actor: this.props.defaultWallet.account,
                                    permission: permission,
                                    }], 
                                    data: {
                                        from: this.props.defaultWallet.account,
                                        receiver: this.state.receiver,
                                        unstake_net_quantity: formatEosQua("0 EOS"),
                                        unstake_cpu_quantity: formatEosQua(this.state.undelegateb + " EOS"),
                                    }
                                },
                            ]
                        }, plaintext_privateKey, (r) => {
                            EasyShowLD.loadingClose();
                            if(r.isSuccess){
                                this.getAccountInfo();
                                EasyToast.show("赎回成功");
                            }else{    
                                if(r.data){
                                    if(r.data.code){
                                        var errcode = r.data.code;
                                        if(errcode == 3080002 || errcode == 3080003|| errcode == 3080004 || errcode == 3080005
                                            || errcode == 3081001)
                                        {
                                            this.props.dispatch({type:'wallet/getFreeMortgage',payload:{username:this.props.defaultWallet.account},callback:(resp)=>{ 
                                            if(resp.code == 608)
                                            { 
                                                //弹出提示框,可申请免费抵押功能
                                                const view =
                                                <View style={styles.passoutsource2}>
                                                    <Text style={[styles.Explaintext2,{color: UColor.arrow}]}>该账号资源(NET/CPU)不足！</Text>
                                                    <Text style={[styles.Explaintext2,{color: UColor.arrow}]}>EosToken官方提供免费抵押功能,您可以使用免费抵押后再进行该操作。</Text>
                                                </View>
                                                EasyShowLD.dialogShow("资源受限", view, "申请免费抵押", "放弃", () => {
                                                    
                                                const { navigate } = this.props.navigation;
                                                navigate('FreeMortgage', {});
                                                // EasyShowLD.dialogClose();
                                                }, () => { EasyShowLD.dialogClose() });
                                            }
                                        }});
                                        }
                                    }
                                    if(r.data.msg){
                                        EasyToast.show(r.data.msg);
                                    }else{
                                        EasyToast.show("赎回失败");
                                    }
                                }else{
                                    EasyToast.show("赎回失败");
                                }
                            }
                        });
                    }else if(this.state.isNetwork){
                        Eos.transaction({
                            actions: [
                                {
                                    account: "eosio",
                                    name: "undelegatebw", 
                                    authorization: [{
                                    actor: this.props.defaultWallet.account,
                                    permission: permission,
                                    }], 
                                    data: {
                                        from: this.props.defaultWallet.account,
                                        receiver: this.state.receiver,
                                        unstake_net_quantity: formatEosQua(this.state.undelegateb + " EOS"),
                                        unstake_cpu_quantity: formatEosQua("0 EOS"),
                                    }
                                },
                            ]
                        }, plaintext_privateKey, (r) => {
                            EasyShowLD.loadingClose();
                            if(r.isSuccess){
                                this.getAccountInfo();
                                EasyToast.show("赎回成功");
                            }else{
                                if(r.data){
                                    if(r.data.code){
                                        var errcode = r.data.code;
                                        if(errcode == 3080002 || errcode == 3080003|| errcode == 3080004 || errcode == 3080005
                                            || errcode == 3081001)
                                        {
                                            this.props.dispatch({type:'wallet/getFreeMortgage',payload:{username:this.props.defaultWallet.account},callback:(resp)=>{ 
                                            if(resp.code == 608)
                                            { 
                                                //弹出提示框,可申请免费抵押功能
                                                const view =
                                                <View style={styles.passoutsource2}>
                                                    <Text style={[styles.Explaintext2,{color: UColor.arrow}]}>该账号资源(NET/CPU)不足！</Text>
                                                    <Text style={[styles.Explaintext2,{color: UColor.arrow}]}>EosToken官方提供免费抵押功能,您可以使用免费抵押后再进行该操作。</Text>
                                                </View>
                                                EasyShowLD.dialogShow("资源受限", view, "申请免费抵押", "放弃", () => {
                                                    
                                                const { navigate } = this.props.navigation;
                                                navigate('FreeMortgage', {});
                                                // EasyShowLD.dialogClose();
                                                }, () => { EasyShowLD.dialogClose() });
                                            }
                                        }});
                                        }
                                    }
                                    if(r.data.msg){
                                        EasyToast.show(r.data.msg);
                                    }else{
                                        EasyToast.show("赎回失败");
                                    }
                                }else{
                                    EasyToast.show("赎回失败");
                                }
                            }
                        });
                    }
                } else {
                    EasyShowLD.loadingClose();
                    EasyToast.show('密码错误');
                }
            } catch (e) {
                EasyShowLD.loadingClose();
                EasyToast.show('未知异常');
            }
            // EasyShowLD.dialogClose();
        }, () => { EasyShowLD.dialogClose() });
    };
    redemption = () => { 
        const { navigate } = this.props.navigation;
        navigate('undelegated', {});
    }
    dismissKeyboardClick() {
        dismissKeyboard();
    }
    
    //扫二维码
    scan() {
        const { navigate } = this.props.navigation;
        navigate('BarCode', {isTurnOut:true,coinType:"EOS"});
    }
    
    //通讯录
    openAddressBook() {
        const { navigate } = this.props.navigation;
        navigate('addressManage', {isTurnOut:true,coinType:this.props.navigation.state.params.account_name});
    }
    
    //购买内存/计算网络抵押
    purchaseMortgage() {
        if(this.state.isMemory) {
            this.buyram();
        }else{
            this.delegateb();
        }
    }
    
    //出售内存/计算网络赎回
    sellRedeem() {
        if(this.state.isMemory) {
            this.sellram();
        }else{
            this.undelegateb();
        }
    }

    //切换tab
    _handleIndexChange = index => {
        this.setState({ index });
    };

     //跳转内存计算网络
     onPress(key, data = {}) {
        const { navigate } = this.props.navigation;
        if (key == 'Memory') {
            navigate('Resources', {account_name: this.props.navigation.state.params.account_name, Memory: true, Calculation: false, Network: false });
        }else if (key == 'Calculation') {
            navigate('Resources', {account_name: this.props.navigation.state.params.account_name, Memory: false, Calculation: true, Network: false });
        }else if (key == 'Network') {
            navigate('Resources', {account_name: this.props.navigation.state.params.account_name, Memory: false, Calculation: false, Network: true });
        }
    }

    //渲染页面
    renderScene = ({ route }) => {
        if (route.key == '1') {
            return (
            <View style={[styles.inptoutsource,{flex: 1,}]}>
                <View>
                    <View style={{height: ScreenUtil.autowidth(70), flexDirection:'row', backgroundColor: UColor.mainColor, marginBottom: ScreenUtil.autowidth(1), }}>
                        <View style={{ alignItems: 'center', justifyContent: 'center', padding: ScreenUtil.autowidth(15), }}>
                            <Text style={{fontSize: ScreenUtil.setSpText(18), color: UColor.fontColor,}}>计算资源</Text>
                        </View>
                        <View style={{flex: 1,padding: ScreenUtil.autowidth(15), justifyContent: 'space-around',}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                    <View style={{width: ScreenUtil.autowidth(6), height: ScreenUtil.autowidth(6), marginHorizontal: ScreenUtil.autowidth(5), borderRadius: 25, backgroundColor: UColor.tintColor,}}/>
                                    <Text style={{fontSize: ScreenUtil.setSpText(12), color: UColor.fontColor}}>已用{this.state.cpu_AlreadyUsed}</Text>
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                    <View style={{width: ScreenUtil.autowidth(6), height: ScreenUtil.autowidth(6), marginHorizontal: ScreenUtil.autowidth(5), borderRadius: 25, backgroundColor: UColor.arrow,}}/>
                                    <Text style={{fontSize: ScreenUtil.setSpText(12), color: UColor.arrow}}>可用{this.state.cpu_available}</Text>
                                </View>
                            </View>
                            <View style={{height: ScreenUtil.autowidth(10), backgroundColor: UColor.riceWhite, borderRadius: 10,}}>
                                <View style={{height: ScreenUtil.autowidth(10), backgroundColor: UColor.tintColor, borderRadius: 10,}} width={this.state.cpu_Percentage}/>
                            </View>
                        </View>
                    </View>
                    <View style={{height: ScreenUtil.autowidth(70), flexDirection:'row', backgroundColor: UColor.mainColor, marginBottom: ScreenUtil.autowidth(1), }}>
                        <View style={{ alignItems: 'center', justifyContent: 'center', padding: ScreenUtil.autowidth(15), }}>
                            <Text style={{fontSize: ScreenUtil.setSpText(18), color: UColor.fontColor,}}>网络资源</Text>
                        </View>
                        <View style={{flex: 1,padding: ScreenUtil.autowidth(15), justifyContent: 'space-around',}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                    <View style={{width: ScreenUtil.autowidth(6), height: ScreenUtil.autowidth(6), marginHorizontal: ScreenUtil.autowidth(5), borderRadius: 25, backgroundColor: UColor.tintColor,}}/>
                                    <Text style={{fontSize: ScreenUtil.setSpText(12), color: UColor.fontColor}}>已用{this.state.net_AlreadyUsed}</Text>
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                    <View style={{width: ScreenUtil.autowidth(6), height: ScreenUtil.autowidth(6), marginHorizontal: ScreenUtil.autowidth(5), borderRadius: 25, backgroundColor: UColor.arrow,}}/>
                                    <Text style={{fontSize: ScreenUtil.setSpText(12), color: UColor.arrow}}>可用{this.state.net_available}</Text>
                                </View>
                            </View>
                            <View style={{height: ScreenUtil.autowidth(10), backgroundColor: UColor.riceWhite, borderRadius: 10,}}>
                                <View style={{height: ScreenUtil.autowidth(10), backgroundColor: UColor.tintColor, borderRadius: 10,}} width={this.state.net_Percentage}/>
                            </View>
                        </View>
                    </View>
                    <View style={{height: ScreenUtil.autowidth(44), paddingHorizontal: ScreenUtil.autowidth(15), flexDirection:'row', alignItems: 'center', backgroundColor: UColor.mainColor, marginBottom: ScreenUtil.autowidth(10), }}>
                        <Text style={{flex: 1, textAlign: 'left', fontSize: ScreenUtil.setSpText(16), color: UColor.fontColor,}}>赎回中</Text>
                        <Text style={{flex: 1, textAlign: 'right', fontSize: ScreenUtil.setSpText(16), color: UColor.arrow,}}>{this.state.redeem} EOS</Text>
                    </View>
                </View>

                <View >
                    <View style={[styles.tablayout,{backgroundColor: UColor.mainColor}]}>  
                        {this.resourceButton([styles.memorytab,{borderColor: UColor.tintColor}], this.state.isMortgage, 'isMortgage', '抵押')}  
                        {this.resourceButton([styles.networktab,{borderColor: UColor.tintColor}], this.state.isRedeem, 'isRedeem', '赎回')}  
                    </View> 
                    <View style={[styles.outsource,{flexDirection:'column',backgroundColor: UColor.mainColor,}]}>
                        <View style={{flexDirection: 'row'}}>
                            <Text style={[styles.inptTitle,{color: UColor.fontColor}]}>计算{this.state.isMortgage ? "抵押" : "赎回"}</Text>
                            <Text style={{fontSize:ScreenUtil.setSpText(12), color: UColor.fontColor, lineHeight: ScreenUtil.autowidth(30)}}>当前价格：{(this.state.currency_surplus == null || this.state.Currentprice == null || this.state.currency_surplus == '' || this.state.currency_surplus == '' || this.state.Currentprice == '0') ? '0.000' : (this.state.currency_surplus/this.state.Currentprice).toFixed(3)}kb</Text>
                        </View>
                        <View style={{flexDirection: 'row'}}>
                            <TextInput ref={(ref) => this._rrpass = ref} value={this.state.delegateb} returnKeyType="go" 
                            selectionColor={UColor.tintColor} style={[styles.inpt,{color: UColor.arrow}]}  placeholderTextColor={UColor.inputtip} 
                            placeholder="输入EOS数量" underlineColorAndroid="transparent" keyboardType="numeric"  maxLength = {15}
                            onChangeText={(delegateb) => this.setState({ delegateb: this.chkPrice(delegateb)})} 
                            />
                        </View>
                    </View>
                    <View style={[styles.outsource,{flexDirection:'column',backgroundColor: UColor.mainColor,}]}>
                        <View style={{flexDirection: 'row'}}>
                            <Text style={[styles.inptTitle,{color: UColor.fontColor}]}>网络{this.state.isRedeem ? "赎回" : "抵押"}</Text>
                            <Text style={{fontSize:ScreenUtil.setSpText(12), color: UColor.fontColor, lineHeight: ScreenUtil.autowidth(30)}}>当前价格：{(this.state.currency_surplus == null || this.state.Currentprice == null || this.state.currency_surplus == '' || this.state.currency_surplus == '' || this.state.Currentprice == '0') ? '0.000' : (this.state.currency_surplus/this.state.Currentprice).toFixed(3)}kb</Text>
                        </View>
                        <View style={{flexDirection: 'row'}}>
                            <TextInput ref={(ref) => this._rrpass = ref} value={this.state.undelegateb} returnKeyType="go" 
                            selectionColor={UColor.tintColor} style={[styles.inpt,{color: UColor.arrow}]}  placeholderTextColor={UColor.inputtip} 
                            placeholder="输入EOS数量" underlineColorAndroid="transparent" keyboardType="numeric"  maxLength = {15}
                            onChangeText={(undelegateb) => this.setState({ undelegateb: this.chkPrice(undelegateb)})} 
                            />
                        </View>
                    </View>
                    <View style={[styles.outsource,{flexDirection:'column',backgroundColor: UColor.mainColor}]}>
                        <View style={{flexDirection: 'row', }}>
                            <Text style={[styles.inptTitle,{color: UColor.fontColor}]}>接收账户(不填默认自己)</Text>
                        </View>
                        <View style={{flexDirection: 'row', }}>
                            <TextInput ref={(ref) => this._account = ref} value={this.state.receiver} returnKeyType="go"
                                selectionColor={UColor.tintColor} style={[styles.inpt,{color: UColor.arrow}]} placeholderTextColor={UColor.inputtip} maxLength={12}
                                placeholder={this.state.receiver} underlineColorAndroid="transparent" keyboardType="default" 
                                onChangeText={(receiver) => this.setState({ receiver: this.chkAccount(receiver)})} 
                            />
                            <Button onPress={() => this.openAddressBook()}>
                                <View style={styles.botnimg}>
                                    <Image source={UImage.al} style={{width: ScreenUtil.autowidth(15), height: ScreenUtil.autowidth(17), }} />
                                </View>
                            </Button> 
                        </View>
                    </View>
                    <View style={{flexDirection: 'row', paddingHorizontal: ScreenUtil.autowidth(18), paddingVertical: ScreenUtil.autowidth(10),}}>
                        <View style={[styles.LeaseTransfer,]}>  
                            {this.leaseTransferButton(styles.tabbutton, this.state.isLease, 'isLease', '租赁')}  
                            {this.leaseTransferButton(styles.tabbutton, this.state.isTransfer, 'isTransfer', '过户')}  
                        </View>
                        <Text style={{flex: 1, fontSize:ScreenUtil.setSpText(12), color: UColor.startup, textAlign: 'right'}}>余额：{this.state.currency_surplus}EOS</Text>
                    </View>
                </View>
                <View style={{flex: 1, justifyContent: 'flex-end', marginHorizontal: ScreenUtil.autowidth(15), marginBottom: ScreenUtil.autowidth(15),}}>
                    <Button onPress={this.purchaseMortgage.bind(this)} >
                        <View style={[styles.botn,{backgroundColor: UColor.tintColor}]}>
                            <Text style={[styles.botText,{color: UColor.btnColor}]}>{this.state.isMortgage ? "抵押" : "赎回"}</Text>
                        </View>
                    </Button>
                </View>
            </View>
          )  
        }else {
            return (
            <View style={[styles.inptoutsource,{flex: 1,}]}>
                <View>
                    <View style={{height: ScreenUtil.autowidth(70), flexDirection:'row', backgroundColor: UColor.mainColor, marginBottom: ScreenUtil.autowidth(1), }}>
                        <View style={{ alignItems: 'center', justifyContent: 'center', padding: ScreenUtil.autowidth(15), }}>
                            <Text style={{fontSize: ScreenUtil.setSpText(18), color: UColor.fontColor,}}>内存资源</Text>
                        </View>
                        <View style={{flex: 1,padding: ScreenUtil.autowidth(15), justifyContent: 'space-around',}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                    <View style={{width: ScreenUtil.autowidth(6), height: ScreenUtil.autowidth(6), marginHorizontal: ScreenUtil.autowidth(5), borderRadius: 25, backgroundColor: UColor.tintColor,}}/>
                                    <Text style={{fontSize: ScreenUtil.setSpText(12), color: UColor.fontColor}}>已用{this.state.ram_AlreadyUsed}</Text>
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                    <View style={{width: ScreenUtil.autowidth(6), height: ScreenUtil.autowidth(6), marginHorizontal: ScreenUtil.autowidth(5), borderRadius: 25, backgroundColor: UColor.arrow,}}/>
                                    <Text style={{fontSize: ScreenUtil.setSpText(12), color: UColor.arrow}}>可用{this.state.ram_available}</Text>
                                </View>
                            </View>
                            <View style={{height: ScreenUtil.autowidth(10), backgroundColor: UColor.riceWhite, borderRadius: 10,}}>
                                <View style={{height: ScreenUtil.autowidth(10), backgroundColor: UColor.tintColor, borderRadius: 10,}} width={this.state.ram_Percentage}/>
                            </View>
                        </View>
                    </View>
                    <View style={{height: ScreenUtil.autowidth(70), flexDirection:'row', backgroundColor: UColor.mainColor, marginBottom: ScreenUtil.autowidth(10), }}>
                        <View style={{ alignItems: 'center', justifyContent: 'center', padding: ScreenUtil.autowidth(15), }}>
                            <Text style={{fontSize: ScreenUtil.setSpText(18), color: UColor.fontColor,}}>全网内存</Text>
                        </View>
                        <View style={{flex: 1,padding: ScreenUtil.autowidth(15), justifyContent: 'space-around',}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                    <View style={{width: ScreenUtil.autowidth(6), height: ScreenUtil.autowidth(6), marginHorizontal: ScreenUtil.autowidth(5), borderRadius: 25, backgroundColor: UColor.tintColor,}}/>
                                    <Text style={{fontSize: ScreenUtil.setSpText(12), color: UColor.fontColor}}>已用{this.state.total_ram_used}</Text>
                                </View>
                                <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                    <View style={{width: ScreenUtil.autowidth(6), height: ScreenUtil.autowidth(6), marginHorizontal: ScreenUtil.autowidth(5), borderRadius: 25, backgroundColor: UColor.arrow,}}/>
                                    <Text style={{fontSize: ScreenUtil.setSpText(12), color: UColor.arrow}}>可用{this.state.total_ram_reserved}</Text>
                                </View>
                            </View>
                            <View style={{height: ScreenUtil.autowidth(10), backgroundColor: UColor.riceWhite, borderRadius: 10,}}>
                                <View style={{height: ScreenUtil.autowidth(10), backgroundColor: UColor.tintColor, borderRadius: 10,}} width={this.state.total_ram_used_Percentage}/>
                            </View>
                        </View>
                    </View>
                </View>
                <View  >
                    <View style={[styles.tablayout,{backgroundColor: UColor.mainColor}]}>  
                        {this.ownOthersButton([styles.memorytab,{borderColor: UColor.tintColor}], this.state.isBuy, 'isBuy', '购买')}  
                        {this.ownOthersButton([styles.networktab,{borderColor: UColor.tintColor}], this.state.isSell, 'isSell', '出售')}  
                    </View> 
                    <View style={[styles.outsource,{flexDirection:'column',backgroundColor: UColor.mainColor,}]}>
                        <View style={{flexDirection: 'row'}}>
                            <Text style={[styles.inptTitle,{color: UColor.fontColor}]}>{this.state.isBuy ? "购买" : "出售" }内存</Text>
                            <Text style={{fontSize:ScreenUtil.setSpText(12), color: UColor.fontColor, lineHeight: ScreenUtil.autowidth(30)}}>当前价格：{this.state.Currentprice} EOS/kb</Text>
                        </View>
                        <View style={{flexDirection: 'row'}}>
                            <TextInput ref={(ref) => this._rrpass = ref} value={this.state.buyRamAmount} returnKeyType="go" 
                            selectionColor={UColor.tintColor} style={[styles.inpt,{color: UColor.arrow}]}  placeholderTextColor={UColor.inputtip} 
                            placeholder="输入EOS数量" underlineColorAndroid="transparent" keyboardType="numeric"  maxLength = {15}
                            onChangeText={(buyRamAmount) => this.setState({ buyRamAmount: this.chkPrice(buyRamAmount)})} 
                            />
                        </View>
                    </View>
                    {this.state.isBuy&&
                    <View style={[styles.outsource,{flexDirection:'column',backgroundColor: UColor.mainColor}]}>
                        <View style={{flexDirection: 'row', }}>
                            <Text style={[styles.inptTitle,{color: UColor.fontColor}]}>接收账户(不填默认自己)</Text>
                        </View>
                        <View style={{flexDirection: 'row', }}>
                            <TextInput ref={(ref) => this._account = ref} value={this.state.receiver} returnKeyType="go"
                                selectionColor={UColor.tintColor} style={[styles.inpt,{color: UColor.arrow}]} placeholderTextColor={UColor.inputtip} maxLength={12}
                                placeholder={this.state.receiver} underlineColorAndroid="transparent" keyboardType="default" 
                                onChangeText={(receiver) => this.setState({ receiver: this.chkAccount(receiver)})} 
                            />
                            <Button onPress={() => this.openAddressBook()}>
                                <View style={styles.botnimg}>
                                    <Image source={UImage.al} style={{width: ScreenUtil.autowidth(15), height: ScreenUtil.autowidth(17), }} />
                                </View>
                            </Button> 
                        </View>
                    </View>}
                    <View style={{flexDirection: 'row', paddingHorizontal: ScreenUtil.autowidth(18), paddingVertical: ScreenUtil.autowidth(10),}}>
                        <Text style={{flex: 1, fontSize:ScreenUtil.setSpText(12), color: UColor.startup, textAlign: 'left'}}>余额：{this.state.currency_surplus}EOS</Text>
                    </View>
                </View>
                <View style={{flex: 1, justifyContent: 'flex-end', marginHorizontal: ScreenUtil.autowidth(15), marginBottom: ScreenUtil.autowidth(15),}}>
                    <Button onPress={this.purchaseMortgage.bind(this)} >
                        <View style={[styles.botn,{backgroundColor: UColor.tintColor}]}>
                            <Text style={[styles.botText,{color: UColor.btnColor}]}>{this.state.isSell ? "出售" : "购买"}</Text>
                        </View>
                    </Button> 
                </View>
            </View>)

        }
    }

   



    render() {
        const c = this.props.navigation.state.params.coinType;
        return (
            <View style={[styles.container,{backgroundColor: UColor.secdfont}]}>
                <Header {...this.props} onPressLeft={true} title="资源管理"  onPressRight={this.recordMortgage.bind()}  
                    avatar={UImage.Mortgage_record} imgWidth={ScreenUtil.autowidth(20)} imgHeight={ScreenUtil.autowidth(20)}  /> 
                
                <TabViewAnimated
                    lazy={true}
                    navigationState={this.state}
                    renderScene={this.renderScene.bind(this)}
                    renderHeader={(props) => <TabBar onTabPress={this._handleTabItemPress} 
                    labelStyle={{ fontSize: ScreenUtil.setSpText(15), margin: 0, marginVertical: ScreenUtil.autowidth(5), color: UColor.tintColor, }} 
                    indicatorStyle={{ backgroundColor: UColor.tintColor, width: ScreenUtil.autowidth(20), marginHorizontal: (ScreenWidth -  ScreenUtil.autowidth(40))/4 }} 
                    style={{ backgroundColor: UColor.mainColor, }} 
                    tabStyle={{ width: ScreenWidth / 2, padding: 0, marginVertical: ScreenUtil.autowidth(10), borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: UColor.riceWhite, }} 
                    scrollEnabled={true} {...props} />}
                    onIndexChange={this._handleIndexChange}
                    initialLayout={{ height: 0, width: ScreenWidth }}
                />
                {/* <KeyboardAvoidingView behavior={Platform.OS == 'ios' ? "position" : null} style={styles.tab}>
                    <ScrollView keyboardShouldPersistTaps="always">
                        <TouchableOpacity activeOpacity={1.0} onPress={this.dismissKeyboardClick.bind(this)}>
                            <View style={[styles.tetleout,{backgroundColor: UColor.mainColor}]}>
                                <Text style={[styles.tetletext,{color: UColor.arrow}]}>{this.state.tetletext}</Text>
                                <ImageBackground source={UImage.line_bg} resizeMode="cover" style={styles.linebgout}>
                                    <ImageBackground source={UImage.strip_bg} resizeMode="cover"  style={styles.stripbgout}>
                                        <View style={{backgroundColor: UColor.secdColor}} height={this.state.column_One}/>
                                    </ImageBackground>
                                    <ImageBackground source={UImage.strip_bg} resizeMode="cover"  style={styles.stripbgout}>
                                        <View style={{backgroundColor: UColor.secdColor}} height={this.state.column_Two}/>
                                    </ImageBackground>
                                    <ImageBackground source={UImage.strip_bg} resizeMode="cover"  style={styles.stripbgout}>
                                        <View style={{backgroundColor: UColor.secdColor}} height={this.state.column_Three}/>
                                    </ImageBackground>
                                    <View style={{width: ((ScreenWidth - 30) * 0.307 - 5) * 0.236,height: (ScreenWidth - 30) * 0.307 - 5, backgroundColor: UColor.secdColor,marginBottom: Platform.OS == 'ios' ? 0.3 : 0.2,justifyContent: 'flex-end'}}>
                                        <LinearGradient colors={['#FE3BE1', '#8585EF', '#06D4FE']} style={{width: ((ScreenWidth - 30) * 0.307 - 5) * 0.236,}} height={this.state.column_One}/>
                                    </View>
                                    <View style={{width: ((ScreenWidth - 30) * 0.307 - 5) * 0.236,height: (ScreenWidth - 30) * 0.307 - 5,backgroundColor: UColor.secdColor,marginBottom: Platform.OS == 'ios' ? 0.3 : 0.2,justifyContent: 'flex-end'}}>
                                        <LinearGradient colors={['#FE3BE1', '#8585EF', '#06D4FE']} style={{width: ((ScreenWidth - 30) * 0.307 - 5) * 0.236,}} height={this.state.column_Two}/>
                                    </View>
                                    <View style={{width: ((ScreenWidth - 30) * 0.307 - 5) * 0.236,height: (ScreenWidth - 30) * 0.307 - 5,backgroundColor: UColor.secdColor,marginBottom: Platform.OS == 'ios' ? 0.3 : 0.2,justifyContent: 'flex-end'}}>
                                        <LinearGradient colors={['#FE3BE1', '#8585EF', '#06D4FE']} style={{width: ((ScreenWidth - 30) * 0.307 - 5) * 0.236}} height={this.state.column_Three}/>
                                    </View>
                                </ImageBackground>
                                <View style={styles.record}>
                                    <View style={styles.recordout}>
                                        <Text style={[styles.ratiotext,{color: UColor.fontColor}]}>{this.state.ContrastOne}</Text>
                                        <Text style={[styles.recordtext,{color: UColor.arrow}]}>{this.state.percentageOne}</Text>
                                    </View>
                                    <View style={styles.recordout}>
                                        <Text style={[styles.ratiotext,{color: UColor.fontColor}]}>{this.state.ContrastTwo}</Text>
                                        <Text style={[styles.recordtext,{color: UColor.arrow}]}>{this.state.percentageTwo}</Text>
                                    </View>
                                    <View style={styles.recordout}>
                                    {this.state.isCalculation||this.state.isNetwork?<CountDownReact
                                        date= {this.state.ContrastThree}
                                        hours=':'
                                        mins=':'
                                        hoursStyle={[styles.ratiotext,{color: UColor.fontColor}]}
                                        minsStyle={[styles.ratiotext,{color: UColor.fontColor}]}
                                        secsStyle={[styles.ratiotext,{color: UColor.fontColor}]}
                                        firstColonStyle={[styles.ratiotext,{color: UColor.fontColor}]}
                                        secondColonStyle={[styles.ratiotext,{color: UColor.fontColor}]}
                                    />:<Text  style={[styles.ratiotext,{color: UColor.fontColor}]}>{this.state.ContrastThree}</Text>}
                                        <Text style={[styles.recordtext,{color: UColor.arrow}]}>{this.state.percentageThree}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={[styles.tablayout,{backgroundColor: UColor.mainColor}]}>  
                                {this.resourceButton([styles.memorytab,{borderColor: UColor.tintColor}], this.state.isMemory, 'isMemory', '内存资源')}  
                                {this.resourceButton([styles.calculationtab,{borderTopColor: UColor.tintColor,borderBottomColor: UColor.tintColor}], this.state.isCalculation, 'isCalculation', '计算资源')}  
                                {this.resourceButton([styles.networktab,{borderColor: UColor.tintColor}], this.state.isNetwork, 'isNetwork', '网络资源')}  
                            </View> 
                           
                            <View >
                                {this.state.isMemory?<View style={styles.wterout}>
                                <View style={styles.OwnOthers}>  
                                        {this.ownOthersButton(styles.tabbutton, this.state.isOwn, 'isOwn', '自己')}  
                                        {this.ownOthersButton(styles.tabbutton, this.state.isOthers, 'isOthers', '他人')}  
                                    </View></View>:
                                    <View style={styles.wterout}>
                                    <View style={styles.OwnOthers}>  
                                        {this.ownOthersButton(styles.tabbutton, this.state.isOwn, 'isOwn', '自己')}  
                                        {this.ownOthersButton(styles.tabbutton, this.state.isOthers, 'isOthers', '他人')}  
                                    </View>
                                    {this.state.isOthers&&
                                    <View style={styles.LeaseTransfer}>  
                                        {this.leaseTransferButton(styles.tabbutton, this.state.isLease, 'isLease', '租赁')}  
                                        {this.leaseTransferButton(styles.tabbutton, this.state.isTransfer, 'isTransfer', '过户')}  
                                    </View>}
                                </View> }
                                {this.state.isOwn ? null:
                                <View style={styles.inptoutsource}>
                                    {this.state.isMemory?<Text style={[styles.inptTitlered,{color: UColor.showy}]}>注：帮他人购买，一旦送出将无法收回！</Text>:<Text style={[styles.inptTitle,{color: UColor.fontColor}]}>设置接收者</Text>}
                                    <View style={[styles.outsource,{borderBottomColor: UColor.secdColor}]}>
                                        <TextInput ref={(ref) => this._account = ref} value={this.state.receiver} returnKeyType="go"
                                            selectionColor={UColor.tintColor} style={[styles.inpt,{color: UColor.arrow}]} placeholderTextColor={UColor.inputtip} maxLength={12}
                                            placeholder="输入接收账号" underlineColorAndroid="transparent" keyboardType="default" 
                                            onChangeText={(receiver) => this.setState({ receiver: this.chkAccount(receiver)})}
                                        />
                                        <Button onPress={() => this.scan()}>
                                            <View style={styles.botnimg}>
                                                <Image source={UImage.scan} style={{width: 26, height: 26, }} />
                                            </View>
                                        </Button> 
                                    </View>
                                </View>}  
                                {this.state.isMemory?<View>
                                    <View style={styles.inptoutsource}>
                                        <View style={{flexDirection: 'row', alignItems: 'center',}}>
                                            <Text style={[styles.inptTitle,{color: UColor.fontColor}]}>购买内存（{this.state.currency_surplus}EOS）</Text>
                                            <Text style={{fontSize:12, color: UColor.arrow,}}>≈{(this.state.currency_surplus == null || this.state.Currentprice == null || this.state.currency_surplus == '' || this.state.currency_surplus == '' || this.state.Currentprice == '0') ? '0.000' : (this.state.currency_surplus/this.state.Currentprice).toFixed(3)}kb</Text>
                                        </View>
                                        <View style={[styles.outsource,]}>
                                            <Text style={[styles.inptTitle,{color: UColor.fontColor}]}>购买内存</Text>
                                            <Text style={{fontSize:ScreenUtil.setSpText(12), color: UColor.arrow,}}>≈{(this.state.currency_surplus == null || this.state.Currentprice == null || this.state.currency_surplus == '' || this.state.currency_surplus == '' || this.state.Currentprice == '0') ? '0.000' : (this.state.currency_surplus/this.state.Currentprice).toFixed(3)}kb</Text>
                                        </View>
                                        <View style={[styles.outsource,{backgroundColor: UColor.mainColor,}]}>
                                            <TextInput ref={(ref) => this._rrpass = ref} value={this.state.buyRamAmount} returnKeyType="go" 
                                            selectionColor={UColor.tintColor} style={[styles.inpt,{color: UColor.arrow}]}  placeholderTextColor={UColor.inputtip} 
                                            placeholder="输入EOS数量" underlineColorAndroid="transparent" keyboardType="numeric"  maxLength = {15}
                                            onChangeText={(buyRamAmount) => this.setState({ buyRamAmount: this.chkPrice(buyRamAmount)})}
                                            />
                                            <Button onPress={this.buyram.bind(this)}>
                                                <View style={[styles.botn,{backgroundColor: UColor.tintColor}]}>
                                                    <Text style={[styles.botText,{color: UColor.btnColor}]}>购买</Text>
                                                </View>
                                            </Button> 
                                        </View>
                                        <View style={[styles.outsource,]}>
                                            <Text style={{flex: 1, fontSize:ScreenUtil.setSpText(12), color: UColor.startup, textAlign: 'left'}}>余额：{this.state.currency_surplus}EOS</Text>
                                            <Text style={{flex: 1, fontSize:ScreenUtil.setSpText(12), color: UColor.startup, textAlign: 'right'}}>当前价格：{(this.state.currency_surplus == null || this.state.Currentprice == null || this.state.currency_surplus == '' || this.state.currency_surplus == '' || this.state.Currentprice == '0') ? '0.000' : (this.state.currency_surplus/this.state.Currentprice).toFixed(3)}kb</Text>
                                        </View>
                                    </View>
                                    {this.state.isOthers ? null:<View style={styles.inptoutsource}>
                                        <View style={{flexDirection: 'row', alignItems: 'center',}}>
                                            <Text style={[styles.inptTitle,{color: UColor.fontColor}]}>出售内存（{this.state.ram_available}KB）</Text>
                                            <Text style={{fontSize:12, color: UColor.arrow,}}>≈{(this.state.ram_available*this.state.Currentprice).toFixed(3)}EOS</Text>
                                        </View>
                                        <View style={[styles.outsource,{borderBottomColor: UColor.secdColor}]}>
                                            <TextInput ref={(ref) => this._rrpass = ref} value={this.state.sellRamBytes} returnKeyType="go" 
                                            selectionColor={UColor.tintColor} style={[styles.inpt,{color: UColor.arrow}]}  placeholderTextColor={UColor.inputtip}
                                            placeholder="输入出售的数量(KB)" underlineColorAndroid="transparent" keyboardType="numeric"  maxLength = {15}
                                            onChangeText={(sellRamBytes) => this.setState({ sellRamBytes: this.chkPrice(sellRamBytes)})}
                                            />
                                            <Button onPress={this.sellram.bind(this)}>
                                                <View style={[styles.botn,{backgroundColor: UColor.tintColor}]}>
                                                    <Text style={[styles.botText,{color: UColor.btnColor}]}>出售</Text>
                                                </View>
                                            </Button> 
                                        </View>
                                    </View>}
                                </View>:
                                <View>
                                    <View style={styles.inptoutsource}>
                                        <Text style={[styles.inptTitle,{color: UColor.fontColor}]}>抵押（EOS）</Text>
                                        <View style={[styles.outsource,{borderBottomColor: UColor.secdColor}]}>
                                            <TextInput ref={(ref) => this._rrpass = ref} value={this.state.delegateb} returnKeyType="go" 
                                            selectionColor={UColor.tintColor} style={[styles.inpt,{color: UColor.arrow}]} placeholderTextColor={UColor.inputtip} 
                                            placeholder="输入抵押数量" underlineColorAndroid="transparent" keyboardType="numeric"  maxLength = {15}
                                            onChangeText={(delegateb) => this.setState({ delegateb: this.chkPrice(delegateb)})}
                                            />
                                            <Button onPress={this.delegateb.bind()}>
                                                <View style={[styles.botn,{backgroundColor: UColor.tintColor}]}>
                                                    <Text style={[styles.botText,{color: UColor.btnColor}]}>抵押</Text>
                                                </View>
                                            </Button> 
                                        </View>
                                    </View>
                                    {!this.state.isTransfer&&<View style={styles.inptoutsource}>
                                        <Text style={[styles.inptTitle,{color: UColor.fontColor}]}>赎回（EOS）</Text>
                                        <View style={[styles.outsource,{borderBottomColor: UColor.secdColor}]}>
                                            <TextInput ref={(ref) => this._rrpass = ref} value={this.state.undelegateb} returnKeyType="go" 
                                            selectionColor={UColor.tintColor} style={[styles.inpt,{color: UColor.arrow}]} placeholderTextColor={UColor.inputtip}
                                            placeholder="输入赎回数量" underlineColorAndroid="transparent" keyboardType="numeric"  maxLength = {15}
                                            onChangeText={(undelegateb) => this.setState({ undelegateb: this.chkPrice(undelegateb)})}   
                                            />
                                            <Button onPress={this.undelegateb.bind()}>
                                                <View style={[styles.botn,{backgroundColor: UColor.tintColor}]}>
                                                    <Text style={[styles.botText,{color: UColor.btnColor}]}>赎回</Text>
                                                </View>
                                            </Button> 
                                        </View>
                                    </View>}
                                </View>}
                            </View>
                            {this.state.isMemory?
                            <View style={[styles.basc,{backgroundColor: UColor.secdColor}]}>
                                <Text style={[styles.basctext,{color: UColor.arrow}]}>· 当前内存价格：{this.state.Currentprice}/KB</Text>
                                <Text style={[styles.basctext,{color: UColor.arrow}]}>· 内存资源，可以使用EOS买入，也可以出售得EOS</Text>
                            </View>
                            :
                            <View style={[styles.basc,{backgroundColor: UColor.secdColor}]}>
                                <Button onPress={this.redemption.bind()}>
                                 <View style={{ height: ScreenUtil.autoheight(30),justifyContent: 'flex-end', alignItems: 'flex-end'  }}>
                                    <Text style={[styles.basctextright,{color: UColor.tintColor,borderBottomColor: UColor.tintColor}]}>赎回遇到问题？</Text>
                                 </View>
                                 </Button>
                                <Text style={[styles.basctext,{color: UColor.arrow}]}>· 获取资源需要抵押EOS。 </Text>
                                <Text style={[styles.basctext,{color: UColor.arrow}]}>· 抵押的EOS可撤销抵押，并于3天后退回。</Text>
                                <Text style={[styles.basctext,{color: UColor.arrow}]}>· 租赁抵押的EOS可自行赎回，过户抵押的EOS，将无法赎回。</Text>
                            </View>}
                        </TouchableOpacity>
                    </ScrollView>  
                </KeyboardAvoidingView> */}
            </View>
        )
    }
}
const styles = StyleSheet.create({
    passoutsource: {
        flexDirection: 'column', 
        alignItems: 'center'
    },
    inptpass: {
        textAlign: "center",
        borderBottomWidth: 1,
        height: ScreenUtil.autoheight(45),
        fontSize: ScreenUtil.setSpText(16),
        paddingBottom: ScreenUtil.autoheight(5),
        width: ScreenWidth-ScreenUtil.autowidth(100),
    },
    inptpasstext: {
        fontSize: ScreenUtil.setSpText(14),
        marginTop: ScreenUtil.autoheight(5),
        lineHeight: ScreenUtil.autoheight(25),
    },
    tabbutton: {  
        alignItems: 'flex-start',   
        justifyContent: 'flex-start', 
    },  
    tablayout: {   
        alignItems: 'center',
        flexDirection: 'row',  
        justifyContent: 'center',
        paddingVertical: ScreenUtil.autoheight(9),
    },  
    memorytab: {
        borderRadius: 5,
        alignItems: 'center',   
        justifyContent: 'center', 
        paddingHorizontal: ScreenUtil.autowidth(22),
        paddingVertical: ScreenUtil.autoheight(5),
    },
    networktab: {
        borderRadius: 5,
        alignItems: 'center',   
        justifyContent: 'center', 
        paddingHorizontal: ScreenUtil.autowidth(22),
        paddingVertical: ScreenUtil.autoheight(5),
    },
    tabText: {  
        fontSize: ScreenUtil.setSpText(18),
    }, 
    container: {
        flex: 1,
        flexDirection:'column',
    },
    wterout: {
        flexDirection: 'row',
        paddingVertical: ScreenUtil.autoheight(10),
    },
    OwnOthers: {
        flexDirection: 'row',
        width: (ScreenWidth - 20) / 2,
        paddingHorizontal: ScreenUtil.autowidth(18),
    },
    LeaseTransfer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inptoutsource: {
        justifyContent: 'center',
        //paddingBottom: ScreenUtil.autoheight(10),
        //paddingHorizontal: ScreenUtil.autowidth(20),
    },
    outsource: {
        flexDirection: 'row',  
        alignItems: 'center',
        height: ScreenUtil.autowidth(65),
        paddingHorizontal: ScreenUtil.autowidth(15),
        marginTop: 1,
    },
    inpt: {
        flex: 1,
        height: ScreenUtil.autoheight(35), 
        fontSize: ScreenUtil.setSpText(14), 
    },
    inptTitle: {
        flex: 1,
        fontSize: ScreenUtil.setSpText(16),  
        lineHeight: ScreenUtil.autoheight(30),
    },
    inptTitlered: {
        fontSize: ScreenUtil.setSpText(14), 
        lineHeight: ScreenUtil.autoheight(35),
    },
    botnimg: {
        alignItems: 'flex-end',
        justifyContent: 'center', 
        width: ScreenUtil.autowidth(86), 
        height: ScreenUtil.autoheight(38), 
        paddingHorizontal: ScreenUtil.autowidth(10),
    },
    botn: {
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        height: ScreenUtil.autoheight(50),
    },
    botText: {
        fontSize: ScreenUtil.setSpText(18), 
    },
    basc: {
        flex: 1,
        padding: ScreenUtil.autoheight(10),
    },
    basctextright :{
        textAlign: 'right',
        borderBottomWidth: 1,
        flexDirection: 'row',  
        fontSize: ScreenUtil.setSpText(14), 
        lineHeight: ScreenUtil.autoheight(20),
    },
    basctext :{
        fontSize: ScreenUtil.setSpText(12), 
        lineHeight: ScreenUtil.autoheight(25),
    },
    tetleout: {
        paddingBottom: ScreenUtil.autoheight(10),
        paddingHorizontal: ScreenUtil.autowidth(15),
    },
    tetletext: {
        fontSize: ScreenUtil.setSpText(15),
        paddingVertical: ScreenUtil.autoheight(5),
    },
    linebgout: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        width: ScreenWidth - 30,
        justifyContent: 'space-around',
        height: (ScreenWidth - 30) * 0.307,
    },
    stripbgout: {
        height: (ScreenWidth - 30) * 0.307 - 5,
        width: ((ScreenWidth - 30) * 0.307 - 5) * 0.236,
        marginBottom: Platform.OS == 'ios' ? 0.3 : 0.2,
    },
    ratiotext: {
        textAlign: 'center',
        fontSize: ScreenUtil.setSpText(12),
    },
    recordtext: {
        fontSize: ScreenUtil.setSpText(12),
    },
    record: {
        flexDirection: 'row',
    },
    recordout: {
        flex: 1,
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: "center",
    },
    tab: {
        flex: 1,
    },
    passoutsource2: {
        flexDirection: 'column', 
        alignItems: 'flex-start',
    },
    Explaintext2: {
        fontSize: ScreenUtil.setSpText(15),
        lineHeight: ScreenUtil.autoheight(30), 
    },
})
export default Resources;