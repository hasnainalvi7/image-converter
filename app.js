import React, { useState } from 'react';
import { View, Button, Alert, Image, StyleSheet, Text, ScrollView } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

export default function App() {
  const [selectedImages, setSelectedImages] = useState([]);

  // Pick multiple images
  const pickImages = async () => {
    try {
      const results = await DocumentPicker.pickMultiple({
        type: [DocumentPicker.types.images],
      });
      setSelectedImages(results.map(file => file.uri));
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', err.message);
      }
    }
  };

  // Convert multiple images to one PDF
  const convertToPDF = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Images Selected', 'Please select at least one image.');
      return;
    }

    try {
      let imagesHTML = '';
      for (const imgPath of selectedImages) {
        const base64 = await RNFS.readFile(imgPath, 'base64');
        imagesHTML += `<img src="data:image/jpeg;base64,${base64}" style="width:100%;margin-bottom:20px;"/>`;
      }

      const htmlContent = `
        <html>
          <body style="display:flex;flex-direction:column;align-items:center;">
            ${imagesHTML}
          </body>
        </html>
      `;

      const file = await RNHTMLtoPDF.convert({
        html: htmlContent,
        fileName: 'images_to_pdf',
        base64: false,
      });

      Alert.alert('Success', `PDF saved at: ${file.filePath}`);
      return file.filePath;
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Share the PDF
  const sharePDF = async () => {
    const pdfPath = await convertToPDF();
    if (!pdfPath) return;

    try {
      await Share.open({
        url: `file://${pdfPath}`,
        type: 'application/pdf',
        failOnCancel: false,
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📸 Image to PDF Converter</Text>

      <Button title="Pick Images" onPress={pickImages} />
      <View style={{ height: 10 }} />
      <Button title="Convert to PDF" onPress={convertToPDF} />
      <View style={{ height: 10 }} />
      <Button title="Convert & Share PDF" onPress={sharePDF} />

      <ScrollView style={{ marginTop: 20 }}>
        {selectedImages.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.image} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 10,
    resizeMode: 'contain',
  },
});
