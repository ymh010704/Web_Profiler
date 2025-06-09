# 웹응용기술 / Node.js를 활용하여 Profiler 분석하기 
## 2025.06.06

## 파일 다운로드 후, node app 또는 node app.js로 프로그램 가동 가능
### server address : localhost:8081
  
> config/config.json의 password와 database 값을 본인의 정보로 변경하여 사용하면 됨.

  
# 참고 사항
 웹을 처음 실행 후 , 임의 DB 데이터 불러오기 버튼은 실행이 안 되거나 에러가 날 것임.

 Why? > 본인 DB의 임의 값을 설정했기 때문, 

 DB에 값을 저장 후, views/index.html의 258번~270번 째 줄의 loadDbData('값'); 부분을 DB의 임의 fileName값을 지정해주면
 웹을 재실행해도 버튼에 설정한 fileName의 값이 출력+분석될 것임.
