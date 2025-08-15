import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import {Card, Title, Paragraph, Avatar} from 'react-native-paper';

const SummaryCard = ({title, count, icon, color, onPress}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <Avatar.Icon icon={icon} size={40} style={{backgroundColor: color}} color="#fff" />
          <Title style={styles.count}>{count}</Title>
          <Paragraph style={styles.title}>{title}</Paragraph>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 4,
  },
  card: {
    elevation: 2,
  },
  content: {
    alignItems: 'center',
    padding: 16,
  },
  count: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  title: {
    fontSize: 14,
    color: 'gray',
  },
});

export default SummaryCard;
