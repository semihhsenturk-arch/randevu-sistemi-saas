// Google Sheets'ten Randevuları Alıp Web Sitenize Gönderen Kod
// Bu kodu Google Sheets dosyanızda Araçlar > Apps Script menüsünden açılan sayfaya yapıştıracaksınız.

function doGet(e) {
  var ss = SpreadsheetApp.openById("154Mtyv_ECh1oG5SeBZK9bTWiqRxszYU1cWA8-MaY4ro");
  // Eğer tablonuz ilk (en soldaki) sayfa değilse "ss.getSheets()[0]" kısmındaki 0 sayısını değiştirebilirsiniz.
  var sheet = ss.getSheets()[0]; 
  var data = sheet.getDataRange().getValues();
  
  // Tabloda hiç veri yoksa boş döndür
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0];
  var result = [];
  
  // 1. satır (başlıklar) hariç diğerlerini döngüye al
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    
    // Her sütunu başlığına göre eşleştir
    for (var j = 0; j < headers.length; j++) {
      var headerName = headers[j] ? headers[j].toString().trim() : "Sutun_" + j;
      var cellValue = row[j];
      
      // Tarih formatlarını düzeltme
      if (cellValue instanceof Date) {
        // YYYY-MM-DD formatına çevir
        var yyyy = cellValue.getFullYear();
        var mm = String(cellValue.getMonth() + 1).padStart(2, '0');
        var dd = String(cellValue.getDate()).padStart(2, '0');
        var hh = String(cellValue.getHours()).padStart(2, '0');
        var min = String(cellValue.getMinutes()).padStart(2, '0');
        cellValue = yyyy + "-" + mm + "-" + dd + " " + hh + ":" + min;
      }
      // Saat formati düzeltme (Eğer özel zaman objesi gelirse)
      else if (cellValue && typeof cellValue === 'object' && cellValue.getTime) {
        var h = String(cellValue.getHours()).padStart(2, '0');
        var m = String(cellValue.getMinutes()).padStart(2, '0');
        cellValue = h + ":" + m;
      }
      
      obj[headerName] = cellValue;
    }
    
    // Yalnızca tamamen boş olmayan satırları ekle
    var isRowEmpty = Object.values(obj).every(function(val) { return val === "" || val === null; });
    if (!isRowEmpty) {
       // Benzersiz bir kimlik (ID) oluştur (Arama kolaylığı için satır nosunu ekliyoruz)
       obj["_sheetRowIndex"] = i + 1; 
       result.push(obj);
    }
  }
  
  var output = JSON.stringify({
    status: "success",
    data: result
  });
  
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}


