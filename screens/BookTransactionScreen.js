import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet,Image,KeyboardAvoidingView,ToastAndroid,Alert} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { TextInput } from 'react-native-gesture-handler';
import db from '../config.js';;
import * as firebase from 'firebase';


export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedData: '',
        buttonState: 'normal',
        scannedBookId:'',
        scannedStudentId:'',
        transactionMessage:''
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
      const {buttonState}=this.state
      if(buttonState==="BookId"){
        this.setState({
          scanned: true,
          scannedBookId: data,
          buttonState: 'normal',
          
        });
      }

      else if(buttonState==="StudentId"){
        this.setState({
          scanned: true,
          scannedStudentId: data,
          buttonState: 'normal',
          
        });
      }
     
    }

    initiateBookIssue=async()=>{
      db.collection('transactions').add({
        'studentId':this.state.scannedStudentId,
        'bookId':this.state.scannedBookId,
        'date':firebase.firestore.Timestamp.now().toDate(),
        'transactionType':"Issued"
      })
      db.collection('books').doc(this.state.scannedBookId).update({
        'bookAvailibility':false
      })
      db.collection('students').doc(this.state.scannedStudentId).update({
        'numOfBooksIssued':firebase.firestore.FieldValue.increment(1)
      })

    }

    initiateBookReturn=async()=>{
      db.collection('transactions').add({
        'studentId':this.state.scannedStudentId,
        'bookId':this.state.scannedBookId,
        'date':firebase.firestore.Timestamp.now().toDate(),
        'transactionType':"Returned"
      })
      db.collection('books').doc(this.state.scannedBookId).update({
        'bookAvailibility':true
      })
      db.collection('students').doc(this.state.scannedStudentId).update({
        'numOfBooksIssued':firebase.firestore.FieldValue.decrement(1)
      })

    }

    checkBookEligibility=async()=>{
      var bookRef=await db.collection('books')
      .where('bookId','==',this.state.scannedBookId)
      .get();
      var transactionType='';
      if(bookRef.docs.length===0){
          transactionType=false;
      }
      else{
        bookRef.docs.map(
        doc=>{
           var book=doc.data();
           if(book.bookAvailibility){
             transactionType="Issue";
           }
           else{
             transactionType="Return";
           }
        }

        )
      }
        return transactionType;
    }

    checkStudentEligibilityForBookIssue=async()=>{
      var StudentRef=await db.collection('students')
      .where('studentId','==',this.state.scannedStudentId)
      .get();
      var isStudentEligible='';
      if(StudentRef.docs.length===0){
        isStudentEligible=false;
        Alert.alert("StudentId does not exist in database")
        this.setState({
          scannedStudentId:'',
          scannedBookId:''
        })
    }
    else
    {
      StudentRef.docs.map(
        doc=>{
        var student=doc.data();
        if(student.numOfBooksIssued<2){
          isStudentEligible=true;
        }
        else{
          isStudentEligible=false;
          this.setState({
            scannedStudentId:'',
            scannedBookId:''
          })
          Alert.alert("StudentId has already issued 2 books");
        }
    })
    }
     
    
     return isStudentEligible;
    }



    checkStudentEligibilityForBookReturn=async()=>{
      const TransactionRef=await db.collection('transactions')
      .where('bookId','==',this.state.scannedBookId).limit(1)
      .get();
      var isStudentEligible='';
     TransactionRef.docs.map(doc=>{
       var lastBookTrabsaction=doc.data();
       if(lastBookTransaction.studentId === this.state.scannedStudentId){
         isStudentEligible=true;
       }
       else{
        isStudentEligible=false;
        Alert.alert("The book was not issued by the student");
       }
       this.setState({
          scannedStudentId:"",
          scannedBookId:""
       })

      } )
        return isStudentEligible;
     }
       
     
    
    





    handleTransaction=async()=>{
    var transactionType=await this.checkBookEligibility();
    if(!transactionType){
      Alert.alert("The book does not exist in the database");
      this.setState({
        scannedBookId:'',
        scannedStudentId:''
      })
    }
    else 
    if(TransactionType==="Issue"){
      var isStudentEligible=await this.checkStudentEligibilityForBookIssue();
      if(isStudentEligible){
        this.initiateBookIssue();
        Alert.alert("Book issues to the student");
      }
    }
    else 
    {
      var isStudentEligible=await this.checkStudentEligibilityForBookReturn();
      if(isStudentEligible){
        this.initiateBookReturn();
        Alert.alert("Book returned");
      }
    }

    // var transactionMessage;
    /*db.collection('books').doc(this.state.scannedBookId).get()
    .then((doc)=>{
      var book=doc.data();
      if(book.bookAvailability){
        this.initiateBookIssue();
        transactionMessage="Book Issued";
        ToastAndroid.show(transactionMessage,ToastAndroid.SHORT)
      }
      else{
        this.initiateBookReturn();
        transactionMessage="Book Return";
        ToastAndroid.show(transactionMessage,ToastAndroid.SHORT)

      }
    })*/

    //this.setState({
     // transactionMessage:transactionMessage
   // })

    
    

    }

    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== 'normal' && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView style={styles.container}
          behaviour="padding" enabled>
           
          
           <Image
            
            source={require("../assets/booklogo.jpg")}
            style={{width:200,height:200}}
           
           />
           <Text style={{fontSize:50,textAlign:'center'}}> Wily</Text>
           

           <View style={styles.inputView}>

            <TextInput placeholder='book id'
             onChangeText={text=>
              this.setState({scannedBookId:text})
            }
            value={this.state.scannedBookId}
           
            style={styles.inputBox}
            >
              
             
            </TextInput>

            <TouchableOpacity style={styles.scanButton}
            onPress={()=>{this.getCameraPermissions('BookId')}}
            >
              <Text>Scan </Text>
            </TouchableOpacity>

            

           </View>
         
           <View style={styles.inputView}>
            <TextInput placeholder='student id'
            onChangeText={text=>
              this.setState({scannedStudentId:text})
            }
            value={this.state.scannedStudentId}
            
            style={styles.inputBox}
            >
              
             
            </TextInput>

            <TouchableOpacity style={styles.scanButton}
            onPress={()=>{this.getCameraPermissions('StudentId')}}
            >
              <Text>Scan </Text>
            </TouchableOpacity>

            </View>

            <TouchableOpacity style={styles.Submit}
            onPress={async()=>{this.handleTransaction();
            
            }}
             
            >


              <Text style={styles.SubmitText}>Submit</Text>
            </TouchableOpacity>

          
         
        </KeyboardAvoidingView>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      
      borderWidth:2,
      width:60
    },
    buttonText:{
      fontSize: 20,
    },
    inputView:{
      flexDirection:"row",
      margin:20,
      
    },
    inputBox:{
      width:200,
      height:40,
      borderWidth:1.5,
      fontSize:20
    },
    Submit:{
      width:100,
      height:60,
      backgroundColor:'pink',
      marginBotton:50
    },
    SubmitText:{
      textAlign:'center',
      fontSize:20,
      textDecorationLine:'underline',
      fontWeight:'bold'
    }
  });