const signedUrlEndpoint = 'https://photoupper.us-e2.cloudhub.io/signedurl';
const processImagesEndpoint = 'https://photoupper.us-e2.cloudhub.io/process-images';
const getPhotosEndpoint = 'https://photoupper.us-e2.cloudhub.io/photos';
const appBaseURL = 'https://photoupper.com';

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function getSignedUrl(filename, type) {
    let url = `${signedUrlEndpoint}?name=${filename}&type=${type}`;
    const response = await fetch(url);
    const responseJSON = await response.json();
    const signedURL = JSON.parse(responseJSON.body).url;
    console.log(signedURL);
    return signedURL;
}

// This will upload the file after having read it
async function upload(files, caption) {
    console.log('triggered');
    let type = 'image/jpeg';
    let uuid = uuidv4();
    let filename = `${uuid}.jpg`;
    const signedURL = await getSignedUrl(filename, type);
    console.log('signedURL: ', signedURL);
    const file = files[0];
    const s3Upload = await fetch(signedURL, {
        method: 'PUT',
        body: file,
        headers: {
            "Content-Type": type
        }
    });
    if (!s3Upload.ok) {
        const message = `An error has occured: ${s3Upload.status}`;
        throw new Error(message);
    } else {
        //const processed = await fetch(`${processImagesEndpoint}?filename=${filename}`);
        const processImageBody = {
            uploadDate: new Date().toISOString(),
            filename: filename,
            caption: caption,
            eventCode: localStorage.getItem('eventCode')
        };
        const processImageParams = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: JSON.stringify(processImageBody)
        };
        console.log(processImageParams);
        const processed = await fetch(processImagesEndpoint, processImageParams);
        const processImageResult = await processed.json();
        console.log('processImageResult:', processImageResult);
        if (processImageResult.statusCode && processImageResult.statusCode === 200) {
            localStorage.setItem('flashMessage', 'Upload successful.');
            window.location.href = "index.html";
        }        
    }
}

async function getPhotos(eventCode) {
    const photosObj = await fetch(`${getPhotosEndpoint}?eventCode=${eventCode}`);
    const photos = await photosObj.json();
    if (!photos?.body?.eventInfo?.eventCode) {
        window.location.href = "eventcode.html";
    }
    return photos.body;
}

function storeEventCode(eventCodeArg) {
    //Check if there is an event code in localStorage
    const eventCodeLocalStorage = localStorage.getItem('eventCode');
    //Check if there is an event code in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventCodeParam = urlParams.get('eventCode');
    if (eventCodeArg) {
        localStorage.setItem('eventCode', eventCodeArg);
    } else if (eventCodeParam !== null) {
        localStorage.setItem('eventCode', eventCodeParam);
    } else if (eventCodeLocalStorage !== null) {
        localStorage.setItem('eventCode', eventCodeLocalStorage);
    } else {
        window.location.href = "eventcode.html";
    }
}
