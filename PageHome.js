document.querySelector(".picture").addEventListener('click',()=>{

    let selectFile = document.querySelector("#choosefile").files[0];

    const file = URL.createObjectURL(selectFile);

    document.querySelector(".li-upload-img").src = file;

  })