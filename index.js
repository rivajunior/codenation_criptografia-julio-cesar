import FormData from 'form-data';
import dotenv from 'dotenv';
import axios from 'axios';
import sha1 from 'sha1';
import fs from 'fs';

const env = dotenv.config();

if (env.error) {
  throw env.error;
}

const token = env.parsed.TOKEN;

axios
  .get(
    `https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=${token}`
  )
  .then(({ data }) => {
    fs.writeFileSync('answer.json', JSON.stringify(data));

    let newData = {
      ...data,
      decifrado: deciferer(data.cifrado, data.numero_casas)
    };

    // Update file
    fs.writeFileSync('answer.json', JSON.stringify(newData));

    newData.resumo_criptografico = sha1(newData.decifrado);

    // Update file
    fs.writeFile('answer.json', JSON.stringify(newData), err => {
      if (err) throw err;

      sendSolution(newData);
    });
  });

function deciferer(data, places) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  let deciphered = '';

  for (let i = 0, len = data.length; i < len; i++) {
    let cipheredChar = data.charAt(i);
    let cipheredCharIndex = alphabet.indexOf(cipheredChar);
    let alphabetIndex;

    // If char is not a alphabet letter, just repeat the char.
    if (cipheredCharIndex === -1) {
      deciphered += cipheredChar;
      continue;
    }

    alphabetIndex = (cipheredCharIndex - places) % 26;

    if (alphabetIndex < 0) {
      alphabetIndex = 26 - Math.abs(alphabetIndex);
    }

    deciphered += alphabet.charAt(alphabetIndex);
  }

  return deciphered;
}

function sendSolution() {
  const form = new FormData();

  form.append('answer', fs.createReadStream('answer.json'));

  axios
    .post(
      `https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=${token}`,
      form,
      { headers: form.getHeaders() }
    )
    .then(result => {
      console.log(result.data);
    });
}
