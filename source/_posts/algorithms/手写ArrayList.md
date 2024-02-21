---
title: 《手写ArrayList》
categories:
  - 算法与数据结构
  - ArrayList
tags:
  - 算法与数据结构
  - List
  - ArrayList
top: 3018
abbrlink: e7bb25a0
---

## 《算法与数据结构:手写ArrayList》

### List的数组

List（列表）是编程中一种极为常见且重要的数据结构，用于存储元素的有序集合。在Java中，List是一个接口，它允许我们以线性方式存储元素，同时提供了一系列操作这些元素的方法，List是线性表的一种。

线性表是一种最基本、最简单、也是最常用的一种数据结构。一个线性表是n个具有相同特性的数据元素的有限序列。在这些元素中，每个元素都有一个前驱和一个后继，除了第一个和最后一个元素之外，其它元素都是首尾相接的。

### List数据结构的基本概念

- **定义**：List是一种允许重复元素的序列，它可以维护元素插入的顺序。
- **特点：**
  - **动态大小：**List的大小不是固定的，它可以根据需要增长或缩小。
  - **有序集合：**每个元素都有其特定的位置（索引）。

<!-- more -->

### List的重要性

- **灵活性**：List比数组更加灵活，可以轻松地添加、删除和访问元素。
- **应用广泛**：从简单的客户端应用程序到复杂的企业级解决方案，List在各种场景下都非常有用。

### List的常见操作

- **添加元素**：可以在List的任意位置添加元素。
- **删除元素**：可以删除指定位置或指定值的元素。
- **查找元素**：可以搜索List中的元素，并返回其位置。
- **遍历元素**：可以遍历List中的所有元素。

### **List抽象接口** 

```java
public interface List<E> {

  
    /**
     * 返回此列表中指定位置的元素。
     *
     * @param index 列表中指定的下标
     * @return 下标中包含的元素
     */

    E get(int index);

    /**
     * 将此列表中指定位置的元素替换为指定元素（可选操作）
     *
     * @param index
     * @param e     原来下标中的旧值
     */
    E set(int index, E e);

    /**
     * 在此列表中的指定位置插入指定元素（可选操作）。
     * 将当前位于该位置的元素（如果有）和任何后续元素向右移动（将其索引加一）。
     *
     * @param index
     * @param e
     */
    void add(int index, E e);

    /**
     * 将指定元素追加到此列表的末尾（可选操作）。
     * 支持此操作的列表可能会对可以添加到此列表的元素进行限制。
     * 特别是，一些列表将拒绝添加空元素，而另一些列表将对可能添加的元素的类型施加限制。
     * 列表类应在其文档中明确指定对可以添加的元素的任何限制
     */
    boolean add(E e);

    /**
     * 列表中是否包含元素e
     *
     * @param e
     * @return
     */
    int indexOf(E e);

    int lastIndexOf(E o);

    /**
     * 如果此列表包含指定元素，则返回 <tt>true<tt>。
     * 更正式地说，当且仅当此列表包含至少一个元素 <tt>e<tt>
     * 且满足 <tt>(o==null ? e==null : o.equals(e ))<tt>。
     */
    boolean contains(E o);

    /**
     * 删除此列表中指定位置的元素（可选操作）。
     * 将所有后续元素向左移动（从索引中减去 1）。返回从列表中删除的元素。
     */

    E remove(int index);

    /**
     * 从此列表中删除第一次出现的指定元素（如果存在）（可选操作）。
     * 如果此列表不包含该元素，则它不会更改。更正式地说，删除具有最低索引i 的元素，
     * 使得(o==null ? get(i)==null : o.equals(get(i))) （如果存在这样的元素）。
     * 如果此列表包含指定的元素（或者等效地，如果此列表由于调用的结果而更改），则返回true 。
     */
    boolean remove(E o);

    /**
     * 返回此列表中的元素数量
     *
     * @return
     */
    int size();

    /**
     * 如果此列表不包含任何元素，则返回true
     */
    boolean empty();
}

```

**数组实现List的数据结构基础**

- 默认容量 DEFAULT_CAPACITY
- 可共享的空实例数组 EMPTY_ELEMENTDATA
- 真正存放数据的数组 elementData

```java

    /**
     * 默认容量
     */
    private static final int DEFAULT_CAPACITY = 10;

    /**
     * 数组允许分配的最大值
     */
    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

    /**
     * 可共享的空实例数组 capacity == 0
     */
    private static final Object[] EMPTY_ELEMENTDATA = {};

    /**
     * 默认数组
     */
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};


    /**
     * 底层数据结构 数组 真正存放数据的数据结构
     */
    transient Object[] elementData;

```

### List初始化

```java
    /**
     * @param initialCapacity 初始化数组大小
     */
    public ArrayList(int initialCapacity) {
        // 直接初始化
        if (initialCapacity > 0) {
            this.elementData = new Object[initialCapacity];
            // 设置共享成员变量
        } else if (initialCapacity == 0) {
            this.elementData = EMPTY_ELEMENTDATA;
        } else {
            throw new IllegalArgumentException("Illegal Capacity: " + initialCapacity);
        }
    }
    /**
     * 默认初始化
     */
    public ArrayList() {
        this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
    }
```

### add**添加元素**

```java
    @Override
    public boolean add(E e) {
        // 确保申请的底层数组的容量可以存入当前这个元素
        ensureCapacityInternal(size + 1);
        // 将元素插入数组 并将size+1
        elementData[size++] = e;
        return true;
    }

    /**
     * 确保底层数组的容量是大于当前需要的最小容量
     * 如果容量不够就进行扩容
     *
     * @param minCapacity 所需最小容量
     */
    private void ensureCapacityInternal(int minCapacity) {
        ensureExplicitCapacity(calculateCapacity(elementData, minCapacity));
    }

    /**
     * 计算容量 选择默认容量和所需容量中的较大者
     */
    private static int calculateCapacity(Object[] elementData, int minCapacity) {
        if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
            return Math.max(DEFAULT_CAPACITY, minCapacity);
        }
        return minCapacity;
    }


    /**
     * 判断是否需要扩容
     */
    private void ensureExplicitCapacity(int minCapacity) {

        if (minCapacity - elementData.length > 0)
            grow(minCapacity);
    }

    /**
     * 扩容
     *
     * @param minCapacity
     */
    private void grow(int minCapacity) {

        int oldCapacity = elementData.length;
        // 默认增加原有素组大小的一半
        int newCapacity = oldCapacity + (oldCapacity >> 1);
        // 选择 newCapacity 和 minCapacity 中的较大者
        if (newCapacity - minCapacity < 0)
            newCapacity = minCapacity;

        // 如果新数组大于我们设定的最大数组长度 MAX_ARRAY_SIZE 则重新计算新数组大小
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);
        // 申请一个新的数组 数组大小为 newCapacity  并将原来数组的中数据拷贝到新数组
        elementData = Arrays.copyOf(elementData, newCapacity);
    }

    /**
     * 可以申请的最大内存
     */
    private static int hugeCapacity(int minCapacity) {
        if (minCapacity < 0)
            throw new OutOfMemoryError();
        return (minCapacity > MAX_ARRAY_SIZE) ?
                Integer.MAX_VALUE :
                MAX_ARRAY_SIZE;
    }
```

### **一维数组插入数据GIF动图**

![img](https://cdn.nadav.com.cn/gh/nadav-cheung/img-repo/hexo-blog/v2-f7be2c419b1bde72bc6bae4797192ef8_1440w.gif)

### **一维数组扩容**

![新申请一个数组，将旧值复制到新数组中](https://cdn.nadav.com.cn/gh/nadav-cheung/img-repo/hexo-blog/v2-91ce3f09ff005fef4c3f79e32d7806fc_1440w-20240202212514681.png)

![使用新数组取代旧数组](https://cdn.nadav.com.cn/gh/nadav-cheung/img-repo/hexo-blog/v2-404876b6399612ed0a07e84234802b1b_1440w.png)

### Java数组扩容实现

```java
    /**
     * 扩容
     *
     * @param minCapacity
     */
    private void grow(int minCapacity) {

        int oldCapacity = elementData.length;
        // 默认增加原有素组大小的一半
        int newCapacity = oldCapacity + (oldCapacity >> 1);
        // 选择 newCapacity 和 minCapacity 中的较大者
        if (newCapacity - minCapacity < 0)
            newCapacity = minCapacity;

        // 如果新数组大于我们设定的最大数组长度 MAX_ARRAY_SIZE 则重新计算新数组大小
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);
        // 申请一个新的数组 数组大小为 newCapacity  并将原来数组的中数据拷贝到新数组
        elementData = Arrays.copyOf(elementData, newCapacity);
    }
```

### add指定位置**插入元素**

```java
    @Override
    public void add(int index, E element) {
        // 确保index的位置是合法的
        rangeCheckForAdd(index);

        // 判断是否扩容
        ensureCapacityInternal(size + 1);

        // 从待插入元素位置开始到结尾的所有元素 向后移动一个位置，将待插入位置空出
        System.arraycopy(elementData, index, elementData, index + 1,
                size - index);
        // 设置元素
        elementData[index] = element;
        // 数量+1
        size++;
    }


    private void rangeCheckForAdd(int index) {
        if (index > size || index < 0)
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }
```

### set**替换元素**

```java
    @Override
    public E set(int index, E element) {
        // 检查下标是否越界
        rangeCheck(index);
        // 旧值
        E oldValue = elementData(index);
        // 插入新值
        elementData[index] = element;
        // 返回旧值
        return oldValue;
    }
```

### remove**删除元素**

![计算要移动的元素](https://cdn.nadav.com.cn/gh/nadav-cheung/img-repo/hexo-blog/v2-c651b2ea3de1359e3f7e252866fbd468_1440w-20240202212602109.png)

![移动元素，覆盖要删除的数据](https://cdn.nadav.com.cn/gh/nadav-cheung/img-repo/hexo-blog/v2-3200fc986303b9036f8832ad51a35f88_1440w.png)

![置空数据](https://cdn.nadav.com.cn/gh/nadav-cheung/img-repo/hexo-blog/v2-92212204942490230aa4f166fb07e99d_1440w-20240202213325202.png)

```java
    public E remove(int index) {
        // 判断待删除元素下标是否越界
        rangeCheck(index);

        // 待删除的旧值
        E oldValue = elementData(index);

        // 计算需要移动位置元素的数量
        int numMoved = size - index - 1;
        if (numMoved > 0)
            // 移动位置
            System.arraycopy(elementData, index + 1, elementData, index,
                    numMoved);
        // size-1 
        elementData[--size] = null; // clear to let GC do its work

        // 返回删除元素
        return oldValue;
    }
```

## [github项目](https://github.com/nadav-cheung/algorithm)
