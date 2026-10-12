
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';

const courses = ['Starter', 'Main Course', 'Dessert'];

export default function App() {
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('Starter');
  const [price, setPrice] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  React.useEffect(() => {
  const loadMenuItems = async () => {
    try {
      const savedItems = await AsyncStorage.getItem('menuItems');

      if (savedItems !== null) {
        setMenuItems(JSON.parse(savedItems));
      }
    } catch (error) {
      console.log('Error loading menu items:', error);
    }
  };

  loadMenuItems();
}, []);
React.useEffect(() => {
  const saveMenuItems = async () => {
    try {
      await AsyncStorage.setItem('menuItems', JSON.stringify(menuItems));
    } catch (error) {
      console.log('Error saving menu items:', error);
    }
  };

  saveMenuItems();
}, [menuItems]);
  const [feedback, setFeedback] = useState(null);

  const addMenuItem = () => {
    if (
      !dishName.trim() ||
      !description.trim() ||
      !course ||
      !price.trim()
    ) {
     setFeedback({
  type: 'error',
  message: 'Please complete all fields.',
});
return;
    }

    const numericPrice = Number(price.replace(',', '.'));

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFeedback({
  type: 'error',
  message: 'Enter a price greater than zero.',
});
return;
    }

    const newItem = {
      id: Date.now().toString(),
      dishName: dishName.trim(),
      description: description.trim(),
      course,
      price: numericPrice.toFixed(2),
    };

    setMenuItems((previousItems) => [newItem, ...previousItems]);
    setDishName('');
    setDescription('');
    setCourse('Starter');
    setPrice('');

   setFeedback({
  type: 'success',
  message: 'Menu item added successfully!',
});
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dishTitle}>{item.dishName}</Text>
        <Text style={styles.price}>R {item.price}</Text>
      </View>
      <Text style={styles.courseTag}>{item.course}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id}
        renderItem={renderMenuItem}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>RESTAURANT MANAGEMENT</Text>
              <Text style={styles.title}>Chef's Menu Manager</Text>
              <Text style={styles.subtitle}>
                Manage your restaurant dishes in one place.
              </Text>
            </View>

            <View style={styles.formCard}>
              {feedback && (
  <Text
    style={{
      color: feedback.type === 'error' ? '#B42318' : '#18794E',
      marginBottom: 12,
      fontWeight: '700',
    }}
  >
    {feedback.message}
  </Text>
)}
              <Text style={styles.sectionTitle}>Add a Menu Item</Text>

              <Text style={styles.label}>Dish Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Grilled chicken"
                value={dishName}
                onChangeText={setDishName}
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Describe the dish and its ingredients"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Course *</Text>
              <View style={styles.courseOptions}>
                {courses.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCourse(item)}
                    style={[
                      styles.courseButton,
                      course === item && styles.selectedCourse,
                    ]}
                  >
                    <Text
                      style={[
                        styles.courseButtonText,
                        course === item && styles.selectedCourseText,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Price (R) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 89.99"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />

              <Pressable style={styles.addButton} onPress={addMenuItem}>
                <Text style={styles.addButtonText}>+ Add Menu Item</Text>
              </Pressable>

              <Text style={styles.requiredNote}>* Required fields</Text>
            </View>

            <View style={styles.listHeading}>
              <Text style={styles.sectionTitle}>Your Menu</Text>
              <Text style={styles.itemCount}>{menuItems.length} items</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>Your menu is empty</Text>
            <Text style={styles.emptyText}>
              Add your first dish using the form above.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F5F0',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#183D32',
    padding: 24,
    paddingTop: 32,
    borderRadius: 20,
    marginBottom: 22,
  },
  eyebrow: {
    color: '#D6B979',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#E0E8E2',
    fontSize: 14,
    lineHeight: 21,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8E6DD',
  },
  sectionTitle: {
    color: '#183D32',
    fontSize: 20,
    fontWeight: '800',
  },
  label: {
    color: '#303B35',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FAFAF7',
    borderWidth: 1,
    borderColor: '#DCDDD5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#202820',
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  courseOptions: {
    gap: 8,
  },
  courseButton: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCDDD5',
    backgroundColor: '#FAFAF7',
  },
  selectedCourse: {
    backgroundColor: '#E2EEE6',
    borderColor: '#183D32',
  },
  courseButtonText: {
    color: '#465149',
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedCourseText: {
    color: '#183D32',
    fontWeight: '800',
  },
  addButton: {
    backgroundColor: '#183D32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  requiredNote: {
    color: '#777D75',
    fontSize: 12,
    marginTop: 12,
  },
  listHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  itemCount: {
    color: '#68736B',
    fontSize: 13,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E6DD',
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  dishTitle: {
    color: '#183D32',
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  price: {
    color: '#183D32',
    fontSize: 16,
    fontWeight: '800',
  },
  courseTag: {
    color: '#8A6A2D',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 6,
  },
  description: {
    color: '#5F685F',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E6DD',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#183D32',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    color: '#68736B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
