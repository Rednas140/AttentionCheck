// Create a KNN classifier
const knnClassifier = ml5.KNNClassifier();

// setting up the DOM variables
const video = document.getElementById('video');
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const attention = document.getElementById("attention");
const audio = new Audio('./images/badoop.mp3');

let accuracyView = document.getElementById("accuracyView")
let distraction = document.getElementById("distraction")
let buttonSend = document.querySelector("#getAccuracy")
//let buttonLearn = document.querySelector("#buttonLearn")
//let buttonSave = document.querySelector("#buttonSave")


//adding event listeners for the button
//buttonLearn.addEventListener("click", learnNew)
buttonSend.addEventListener("click", clickedResponse)
//buttonSave.addEventListener("click", saveModel)

// setting up variables
let distracted;
let soundPlay = false;
let prediction;
let showingPopup;
let predictions = [];
let predictionArray = [];
let predictionsLearn = [];

// for calculating the accuracy
let accuracy;
let total = 0;
let amountCorrect = 0;

setInterval(classifyNew, 100);
setInterval(openForm, 20000);
setInterval(resetValue, 3000);

// Create a new poseNet method
knnClassifier.load("myKNN.json");
const facemesh = ml5.facemesh(video, modelLoaded);

//function for the starting of the loop an drawing the camera
function drawCameraIntoCanvas() {
    ctx.drawImage(video, 0, 0, 640, 480);
    drawKeypoints();
    window.requestAnimationFrame(drawCameraIntoCanvas);
}

// Loop over the drawCameraIntoCanvas function
drawCameraIntoCanvas();

// When the model is loaded
function modelLoaded() {
    console.log('Model Loaded!');
}

function predictArray(predictions) {
    predictionArray = [];

    for (let i = 0; i < predictions.length; i++) {
        predictionArray.push(predictions[i].annotations.leftCheek[0][0])
        predictionArray.push(predictions[i].annotations.leftCheek[0][1])
        predictionArray.push(predictions[i].annotations.leftCheek[0][2])
        predictionArray.push(predictions[i].annotations.rightCheek[0][0])
        predictionArray.push(predictions[i].annotations.rightCheek[0][1])
        predictionArray.push(predictions[i].annotations.rightCheek[0][2])
    }
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
    // Loop through all the predictions detected
    for (let i = 0; i < predictions.length; i++) {
        predictArray(predictions)
        // For each face detected, loop through all the keypoints on the face
        for (let j = 0; j < predictions[i].mesh.length; j += 1) {
            let keypoint = predictions[i].scaledMesh[j];

            // Only draw an ellipse is the face probability is bigger than 0.9
            if (predictions[i].faceInViewConfidence > 0.9) {
                ctx.beginPath();
                ctx.arc(keypoint[0], keypoint[1], 1, 0, 2 * Math.PI);

                //gives a diffrent color to the keypoints for diffrent types of distraction
                if (distracted == 2) {
                    ctx.fillStyle = '#e63946';
                }
                if (distracted == 0) {
                    ctx.fillStyle = '#40916c';
                }
                ctx.fill();
            }
        }
        // For each face detected, loop through all the keypoints around the face
        for (let k = 0; k < predictions[i].annotations.silhouette.length; k += 1) {
            let silhouette = predictions[i].annotations.silhouette[k];

            // Only draw an ellipse is the pose probability is bigger than 0.9
            if (predictions[i].faceInViewConfidence > 0.9) {
                ctx.beginPath();
                ctx.arc(silhouette[0], silhouette[1], 2, 0, 2 * Math.PI);

                //gives a diffrent color to the keypoints for diffrent types of distraction
                if (distracted == 2) {
                    ctx.fillStyle = 'red';
                }
                if (distracted == 0) {
                    ctx.fillStyle = 'green';
                }
                ctx.fill();
            }
        }
    }
}

// function to remove the classes (for DRY code)
function removeClasses() {
    attention.classList.remove("red");
    attention.classList.remove("green");
}

//get permission to use the camera
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
        video: true
    }).then(function (stream) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
        };
    });
}

// Listen to new 'pose' events
facemesh.on('face', (results) => {
    predictions = results;
});

// function learnNew() {
//     predictArray(predictions)
//     let radiobtn = document.getElementsByName("attention")
//     for (i = 0; i < radiobtn.length; i++) {
//         if (radiobtn[i].checked)
//         knnClassifier.addExample(predictionArray, radiobtn[i].value)
//     }
// }

function classifyNew() {
    if (predictionArray.length != 0) {
        predictArray(predictions)
        knnClassifier.classify(predictionArray, (err, result) => {
            //prediction = result.label
            if (result != undefined) {
                if (result.confidencesByLabel.Distracted > result.confidencesByLabel.Paying) {
                    prediction = "Distracted"
                    if (soundPlay == false) {
                        audio.play();
                        soundPlay = true;
                    }
                }
                if (result.confidencesByLabel.Paying > result.confidencesByLabel.Distracted) {
                    prediction = "Paying"
                }
            }
        })
        //console.log(`I think it's a ${prediction}`)
        if (prediction != undefined) {
            if (prediction == "Distracted") {
                distracted = 2;
                attention.innerHTML = "Distracted"
                if (showingPopup == false || distraction.innerHTML == "") {
                    distraction.innerHTML = "Distracted"
                }
                removeClasses();
                attention.classList.add("red");
            }
            if (prediction == "Paying") {
                distracted = 0;
                attention.innerHTML = "Paying attention";
                if (showingPopup == false || distraction.innerHTML == "") {
                    distraction.innerHTML = "Paying attention"
                }
                removeClasses();
                attention.classList.add("green");
            }
        }
    }
}

function openForm() {
    if (Number.isInteger(distracted)) {
        predictionsLearn = predictionArray
        console.log(predictionsLearn)
        showingPopup = true
        document.getElementById("accuracyForm").style.display = "block";
        setTimeout(closeForm, 6000);
    }
}

// function saveModel() {
//     knnClassifier.save("myKNN.json");
// }

function clickedResponse() {
    let accuracyBtn = document.getElementsByName("accuracy")
    for (i = 0; i < accuracyBtn.length; i++) {
        if (accuracyBtn[i].checked)
            accuracyCalc(accuracyBtn[i].value)
    }
    closeForm()
}

function accuracyCalc(data) {
    if (data == "right") {
        total++
        amountCorrect++
        accuracy = amountCorrect / total * 100
        accuracy = accuracy.toFixed(2)
        accuracyView.innerHTML = `${accuracy}%`
        if (distraction.innerHTML == "Paying attention") {
            knnClassifier.addExample(predictionsLearn, "Paying")
        }
        if (distraction.innerHTML == "Distracted") {
            knnClassifier.addExample(predictionsLearn, "Distracted")
        }
    }
    if (data == "wrong") {
        total++
        accuracy = amountCorrect / total * 100
        accuracy = accuracy.toFixed(2)
        accuracyView.innerHTML = `${accuracy}%`
        if (distraction.innerHTML == "Paying attention") {
            knnClassifier.addExample(predictionsLearn, "Distracted")
        }
        if (distraction.innerHTML == "Distracted") {
            knnClassifier.addExample(predictionsLearn, "Paying")
        }
    }
}

function closeForm() {
    showingPopup = false;
    document.getElementById("accuracyForm").style.display = "none";
    predictionsLearn = [];
}

function resetValue() {
    soundPlay = false
}