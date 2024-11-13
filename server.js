import 'https://deno.land/std/dotenv/load.ts';

const endPoint = 'https://api.openai.com/v1/chat/completions';
const modelName = 'gpt-3.5-turbo';
const chatGptApiKey = Deno.env.get('APIKEY');

Deno.serve(async (req) => {
  const payload = await req.text();
  const json = JSON.parse(payload);

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${chatGptApiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: json.messages,
      max_tokens: json.max_tokens
    })
  };

  const myRequest = new Request(endPoint, requestOptions);
  const res = await fetch(myRequest);
  const obj = await res.json();

  const body = JSON.stringify(obj);
  return new Response(body, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'content-type': 'application/json; charset=utf-8'
    }
  });
});