import { Card } from 'react-native-elements';
import { StyleSheet, View } from 'react-native';

const Cards = ({children}) => {
    return (
            <Card containerStyle={styles.overviewCard}>
                {children}
            </Card>    
    )
}

export default Cards;

const styles = StyleSheet.create({
  overviewCard: {
    borderRadius: 12,
    padding: 16,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
  actionsCard: {
    borderRadius: 12,
    padding: 16,
    margin: 10,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
  setupCard: {
    borderRadius: 12,
    padding: 16,
    margin: 10,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
    backgroundColor: '#e8f4ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  // Metrics
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});