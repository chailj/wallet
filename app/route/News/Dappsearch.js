import React from 'react';
import { connect } from 'react-redux'
import {  StyleSheet, Image, View, Text, TextInput, TouchableOpacity,Platform  } from 'react-native';
import UColor from '../../utils/Colors'
import UImage from '../../utils/Img'
import Header from '../../components/Header'
import ScreenUtil from '../../utils/ScreenUtil'
import { EasyToast } from '../../components/Toast';
import BaseComponent from "../../components/BaseComponent";
var dismissKeyboard = require('dismissKeyboard');


@connect(({wallet, assets,vote}) => ({...wallet, ...assets, ...vote}))
class Dappsearch extends BaseComponent {

    static navigationOptions = {
        title: 'DAPP搜索',
        header:null,  
    };

    // 构造函数  
    constructor(props) { 
        super(props);
        this.state = {
            labelname: '',
            theme: this.props.navigation.state.params.theme,
        }
    }

    componentDidMount() {

    }

    componentWillUnmount(){
        //结束页面前，资源释放操作
        super.componentWillUnmount();

    }

    //前往
    _query =(labelname) => {
        this.dismissKeyboardClick();
        if (labelname == "") {
            EasyToast.show('请输入DAPP网址');
            return;
        }else{
            const { navigate } = this.props.navigation;
            navigate('DappWeb', { title: 'CustomDapp', url: labelname });
        }
    }

    dismissKeyboardClick() {
        dismissKeyboard();
    }

    getBlur() {
        // this._raccount.focus();
    }

    render() {
        return (
            <View style={[styles.container,{backgroundColor: UColor.secdColor}]}>
                <Header {...this.props} onPressLeft={true} title="DAPP搜索" />
                <View style={[styles.header,{backgroundColor: UColor.mainColor}]}>  
                    <View style={[styles.inptout,{borderColor:UColor.riceWhite,backgroundColor:UColor.btnColor}]} >
                        <Image source={UImage.Magnifier_ash} style={styles.headleftimg} />
                        <TextInput ref={(ref) => this._raccount = ref} value={this.state.labelname} keyboardType="default"
                            selectionColor={UColor.tintColor} style={[styles.inpt,{color: UColor.arrow}]} autoCorrect={true}
                            underlineColorAndroid="transparent" onChangeText={(labelname) => this.setState({ labelname })}
                            onBlur={() => this.getBlur()}
                            placeholderTextColor={UColor.inputtip}  placeholder="输入DAPP网址"  returnKeyType="go" />
                    </View>    
                    <TouchableOpacity onPress={this._query.bind(this,this.state.labelname)}>  
                        <Image source={UImage.goto} style={styles.cancelimg} resizeMode='stretch'/>
                    </TouchableOpacity>  
                </View> 
                <View style={styles.btnout}>
                  <View style={styles.manualout}>
                      <Text style={[styles.prompttext,{color: UColor.arrow}]}>注意：</Text>
                      <Text style={[styles.prompttext,{color: UColor.arrow}]}>您所访问的页面将进入第三方Dapp,您在第三方Dapp上的所有行为应遵守该Dapp的用户协议和隐私政策,由该第三方Dapp直接并单独向您承担责任,EosToken不承担任何责任。</Text>
                  </View>
                  <View style={styles.logout}>
                      <Image source={UImage.bottom_log} style={styles.logimg}/>
                      <Text style={[styles.logtext,{color: UColor.arrow}]}>EosToken 专注柚子生态</Text>
                  </View>
                </View>
            </View>
        )
    }
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      flexDirection:'column',
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: ScreenUtil.autoheight(7),
      paddingHorizontal: ScreenUtil.autowidth(15),
    },
    headleftimg: {
      width: ScreenUtil.autowidth(18),
      height: ScreenUtil.autowidth(18),
      marginHorizontal: ScreenUtil.autowidth(10),
    },
    inptout: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 5,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: 'center',
      height: ScreenUtil.autoheight(30),
    },
    inpt: {
      flex: 1,
      height: ScreenUtil.autoheight(45),
      fontSize: ScreenUtil.setSpText(14),
    },
    cancelimg: {
      width: ScreenUtil.autowidth(23),
      height: ScreenUtil.autowidth(23),
      marginLeft: ScreenUtil.autowidth(15),
    },
    prompttext: {
      fontSize: ScreenUtil.setSpText(12),
      lineHeight: ScreenUtil.autoheight(20),
    },
    btnout: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    manualout: {
      paddingTop: ScreenUtil.autowidth(40),
      paddingHorizontal: ScreenUtil.autowidth(35),
    },
    logout:{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: ScreenUtil.autoheight(20),
    },
    logimg: {
      width: ScreenUtil.autowidth(50), 
      height: ScreenUtil.autowidth(50)
    },
    logtext: {
      fontSize: ScreenUtil.setSpText(14),
      lineHeight: ScreenUtil.autoheight(30),
    },
})
export default Dappsearch;