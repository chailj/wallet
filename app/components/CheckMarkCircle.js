import React, { Component } from 'react'
import {View,Text, TouchableOpacity} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Ionicons from 'react-native-vector-icons/Ionicons'
import ScreenUtil from '../utils/ScreenUtil'

export default class CheckMarkCircle extends Component {

  constructor(props){
    super(props)
  }

  render(){
    let {backgroundColors, title, onPress, imgWidth, imgHeight} = this.props

    return (
        <View >
            {/* <View style={{top:0,left:0,width:this.props.width,height:this.props.height,position:"absolute",backgroundColor:'#D9D9D9',borderRadius:2}}>

            </View> */}
            {!this.props.selected ? 
            <TouchableOpacity onPress={onPress ? onPress: ()=>{}} style={{flexDirection: "row", alignItems: 'center',justifyContent:'center', paddingHorizontal: ScreenUtil.autowidth(15),}}>
              <View style={{width: ScreenUtil.autowidth(18), height: ScreenUtil.autowidth(18), borderRadius:25,backgroundColor: '#D9D9D9',alignItems: 'center',justifyContent:'center',}}>
                <Ionicons color={'#FFF'}  name="md-checkmark" size={ScreenUtil.autowidth(12)} />
              </View>
            </TouchableOpacity>
            :
            <TouchableOpacity onPress={onPress ? onPress: ()=>{}} style={{flexDirection: "row", alignItems: 'center',justifyContent:'center', paddingHorizontal: ScreenUtil.autowidth(15),}}>
              <LinearGradient colors={['#3A42F1','#69B6FF']} start={{x: 0, y: 0}} end={{x: 1, y: 0}}  style={{width: ScreenUtil.autowidth(18), height: ScreenUtil.autowidth(18), borderRadius:25,alignItems: 'center', justifyContent:'center',}}>
                <Ionicons color={'#FFF'}  name="md-checkmark" size={ScreenUtil.autowidth(12)} />
              </LinearGradient>
            </TouchableOpacity>

            }
        </View>
    )
  }
}
