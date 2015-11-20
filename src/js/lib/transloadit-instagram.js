const DATA_FROM_INSTAGRAM = {
  images: [
    'https://unsplash.it/600/600?image=921',
    'https://unsplash.it/600/600?image=870',
    'https://unsplash.it/600/600?image=823'
  ]
};

function fetchData(apiEndpoint) {
  return Promise.resolve(DATA_FROM_INSTAGRAM);
}

export default function transloaditInstagram(core, options) {
  const userID = options.userID;
  fetchData('http://transloadit-endpoint/instagram/${userID}')
    .then(function(data) {
      console.log(data);
      core.prepare(data);
    });
}
