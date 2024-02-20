---
title: 《优先队列PriorityQueue》
categories:
  - 算法与数据结构
  - priorityQueue
tags:
  - 算法与数据结构
  - priorityQueue
top: 30444
abbrlink: 96e44c12
---
## 《算法与数据结构：优先队列PriorityQueue》

## 什么是优先队列？

优先队列是一种特殊的队列，其核心特性在于队列中的元素是按照一定的优先级进行排序的，而不是按照它们进入队列的顺序。在优先队列中，元素被赋予一个优先级，当访问队列时，优先级最高的元素最先被删除。这种机制使得优先队列非常适用于那些需要快速访问最重要元素的场合。

![img](https://cdn.nadav.com.cn/gh/nadav-cheung/img-repo/hexo-blog/202402201117648.jpg)

**可以看到优先攻击目标有三个选项，当我们点击自动补刀时，游戏英雄就会按照相应的优先级进行攻击**

### 特点

- **动态排序**：优先队列内部的元素会根据它们的优先级动态排序，确保每次出队的都是当前优先级最高的元素。
- **高效性**：通过使用高效的数据结构（如二叉堆），优先队列可以在对数时间复杂度内完成插入和删除最优元素的操作。

### 应用场景

- **任务调度**：在操作系统中管理进程或任务的执行顺序。
- **图算法**：如在Dijkstra最短路径算法中选择下一个要访问的节点。
- **事件驱动模拟**：按事件优先级顺序处理模拟事件。
<!-- more -->
## 优先队列的工作原理

要理解优先队列是如何工作的，首先需要了解它背后最常用的数据结构——二叉堆。

### 二叉堆简介

二叉堆是一种完全二叉树，树中的每个节点都满足堆属性，即节点的键值大于等于（或小于等于）其子节点的键值。这种属性使得堆的根节点总是存储最大元素（在最大堆中）或最小元素（在最小堆中）。

### 插入操作

当新元素被加入到优先队列时，它首先被插入到堆的末尾。随后，通过一系列上浮操作，该元素可能会上移至更靠近根部的位置，以维持堆的有序性。

### 删除操作

删除操作通常涉及到移除根节点（即优先级最高的元素），然后将堆的最后一个元素移至根部，并通过下沉操作重新恢复堆的有序性。

## 实现优先队列

### PriorityQueue类

Java的PriorityQueue类基于优先级堆实现，支持基本操作如插入、删除及查看优先级最高的元素。其泛型设计允许存储任意类型的对象，只要这些对象实现了Comparable接口，或者在创建队列时提供了一个Comparator。

### 使用最小堆实现优先队列

```java
import java.util.Arrays;

/**
 * 优先队列
 * 优先队列是一个基于优先级堆的无界队列。优先队列的元素按照其自然顺序进行排序
 */
public class PriorityQueue<E extends Comparable<? super E>> implements Queue<E> {

    /**
     * 要分配的数组的最大大小。
     * 一些虚拟机在数组中保留一些头字。尝试分配更大的数组可能会导致 OutOfMemoryError：
     * 请求的数组大小超出 VM 限制
     */
    public static final int SOFT_MAX_ARRAY_LENGTH = Integer.MAX_VALUE - 8;

    /**
     * 默认初始容量
     */
    private static final int DEFAULT_INITIAL_CAPACITY = 11;
    transient Object[] elements;

    int size;

    /**
     * 构造一个空优先队列，其初始容量足以容纳 11 个元素。
     */
    public PriorityQueue() {
        this(DEFAULT_INITIAL_CAPACITY);
    }

    /**
     * 构造一个具有指定初始容量的优先队列。
     *
     * @param initialCapacity 优先队列的初始容量
     * @throws IllegalArgumentException 如果指定的初始容量为负
     */
    public PriorityQueue(int initialCapacity) {
        // Note: This restriction of at least one is not actually needed,
        // but continues for 1.5 compatibility
        if (initialCapacity < 1)
            throw new IllegalArgumentException();
        this.elements = new Object[initialCapacity];
    }

    /**
     * 将一个数组堆化处理
     *
     * @param nums 带堆化的数组
     */

    public PriorityQueue(E[] nums) {
        initFromArray(nums);
    }

    // Ensures that elementData[0] exists, helping peek() and poll().
    private static Object[] ensureNonEmpty(Object[] nums) {
        return (nums.length > 0) ? nums : new Object[1];
    }

    /**
     * 在位置 k 处插入项 x，通过将 x 沿着树重复降级直到它小于或等于其子项或者是叶子来保持堆不变性。
     */
    @SuppressWarnings("unchecked")
    private static <E> void siftDownComparable(int index, Object element, Object[] elements, int length) {
        int half = length >>> 1;
        Comparable<? super E> key = (Comparable<? super E>) element;
        while (index < half) {

            int child = leftChild(index);

            // 两个孩子中的较小者
            Object c = elements[child];

            // 右边孩子节点
            int rightChildIndex = child + 1;

            if (rightChildIndex < length &&
                    ((Comparable<? super E>) c).compareTo((E) elements[rightChildIndex]) > 0) {
                c = elements[child = rightChildIndex];
            }

            // key小于两个孩子节点 满足堆的性质
            if (key.compareTo((E) c) <= 0)
                break;

            elements[index] = c;
            index = child;
        }
        elements[index] = key;
    }

    /**
     * 左孩子节点
     *
     * @param parent 父节点
     * @return 左孩子节点
     */
    private static int leftChild(int parent) {
        return parent << 1 + 1;
    }

    @SuppressWarnings("unchecked")
    private static <T> void siftUpComparable(int index, T element, Object[] elements) {
        Comparable<? super T> key = (Comparable<? super T>) element;
        while (index > 0) {
            int parent = parent(index);
            Object e = elements[parent];
            if (key.compareTo((T) e) >= 0)
                break;
            elements[index] = e;
            index = parent;
        }
        elements[index] = key;
    }

    /**
     * 父节点
     *
     * @param index 子节点
     * @return 父节点
     */
    private static int parent(int index) {
        if (index == 0) {
            throw new IllegalArgumentException("index-0 doesn't have parent");
        }
        return (index - 1) >>> 1;
    }

    /**
     * 返回一个新的数组长度，以便将其传递给 Arrays.copyOf 方法。
     * 该长度应该是新数组的长度。
     * 该方法将计算新数组的长度，以便将其传递给 Arrays.copyOf 方法。
     * 该长度应该是新数组的长度。
     * 该方法将计算新数组的长度，以便将其传递给 Arrays.copyOf 方法。
     * 如果新长度不超过 MAX_ARRAY_LENGTH，则它将是新数组的长度。
     * 否则，如果旧长度小于 MAX_ARRAY_LENGTH，则新长度将是 MAX_ARRAY_LENGTH。
     * 否则，新长度将是 Integer.MAX_VALUE。
     * 参数：
     * oldLength - 旧数组的长度
     * minGrowth - 最小增长
     * prefGrowth - 首选增长
     * 返回：
     * 新数组的长度
     */
    public static int newLength(int oldLength, int minGrowth, int prefGrowth) {
        // preconditions not checked because of inlining
        // assert oldLength >= 0
        // assert minGrowth > 0

        int prefLength = oldLength + Math.max(minGrowth, prefGrowth); // might overflow
        if (0 < prefLength && prefLength <= SOFT_MAX_ARRAY_LENGTH) {
            return prefLength;
        } else {
            // put code cold in a separate method
            return hugeLength(oldLength, minGrowth);
        }
    }

    /**
     * 边缘条件的容量计算，特别是溢出。
     * 参数：
     * oldLength - 旧数组的长度
     * minGrowth - 最小增长
     * 返回：
     * 新数组的长度
     * 抛出：
     * OutOfMemoryError - 如果新长度超出范围
     */

    private static int hugeLength(int oldLength, int minGrowth) {
        int minLength = oldLength + minGrowth;
        if (minLength < 0) { // overflow
            throw new OutOfMemoryError(
                    "Required array length " + oldLength + " + " + minGrowth + " is too large");
        } else if (minLength <= SOFT_MAX_ARRAY_LENGTH) {
            return SOFT_MAX_ARRAY_LENGTH;
        } else {
            return minLength;
        }
    }

    /**
     * 初始化堆的内存
     *
     * @param nums 初始化传入的树组
     */

    private void initFromArray(E[] nums) {
        initElementsFromArray(nums);
        heapify();
    }


    /**
     * 初始化堆的内存
     *
     * @param nums 初始化传入的树组
     */
    private void initElementsFromArray(E[] nums) {
        int len = nums.length;
        for (Object e : nums)
            if (e == null)
                throw new NullPointerException();
        // 确保已经初始化
        this.elements = ensureNonEmpty(nums);
        this.size = len;
    }

    /**
     * Establishes the heap
     */
    private void heapify() {
        final Object[] es = elements;
        // 容量
        int n = size;
        // 最后一个非叶子节点
        int i = (n >>> 1) - 1;
        for (; i >= 0; i--)
            siftDownComparable(i, es[i], es, n);
    }

    /**
     * 返回队列中的元素数。
     *
     * @return 队列中的元素数
     */
    @Override
    public int size() {
        return this.size;
    }

    /**
     * 返回队列中的元素数。
     *
     * @return 队列中的元素数
     */
    @Override
    public boolean empty() {
        return size() == 0;
    }

    /**
     * 添加元素
     *
     * @param e 要添加的元素
     * @return 如果队列由于调整大小而更改，则为 true
     * @throws NullPointerException 如果指定的元素为 null
     */
    @Override
    public boolean offer(E e) {
        if (e == null)
            throw new NullPointerException();
        int i = size;
        if (i >= elements.length)
            grow(i + 1);
        siftUp(i, e);
        size = i + 1;
        return true;
    }

    /**
     * 上浮操作
     * 在位置 k 处插入项 x，通过将 x 沿树向上提升直到它大于或等于其父项，或者是根，来保持堆不变性。
     * 与 siftDown 类似
     */
    private void siftUp(int k, E x) {
        siftUpComparable(k, x, elements);
    }

    /**
     * Increases the capacity of the array.
     *
     * @param minCapacity the desired minimum capacity
     */
    private void grow(int minCapacity) {
        int oldCapacity = elements.length;
        // Double size if small; else grow by 50%
        int newCapacity = newLength(oldCapacity,
                minCapacity - oldCapacity, /* minimum growth */
                oldCapacity < 64 ? oldCapacity + 2 : oldCapacity >> 1
                /* preferred growth */);
        elements = Arrays.copyOf(elements, newCapacity);
    }

    /**
     * Inserts the specified element into this priority queue.
     *
     * @return {@code true} (as specified by {@link Queue#offer})
     * @throws ClassCastException   if the specified element cannot be
     *                              compared with elements currently in this priority queue
     *                              according to the priority queue's ordering
     * @throws NullPointerException if the specified element is null
     */
    @Override
    public E poll() {
        final Object[] es;
        final E result;

        if ((result = (E) ((es = elements)[0])) != null) {
            final int n;
            final E x = (E) es[(n = --size)];
            es[n] = null;
            if (n > 0) {
                siftDownComparable(0, x, es, n);
            }
        }
        return result;
    }

    /**
     * Retrieves, but does not remove, the head of this queue.
     *
     * @return the head of this queue, or {@code null} if this queue is empty
     */
    @Override
    public E peek() {
        return (E) elements[0];
    }
}
```

## 优先队列的应用

优先队列的应用广泛，覆盖了从系统内核到高级应用程序的各个方面。

### 任务调度

在多任务操作系统中，优先队列可用于管理进程或线程的执行。系统根据任务的紧急程度、资源需求等因素确定任务的优先级，以确保关键任务能够获得优先处理。

### 网络流量管理

在网络路由器和交换机中，优先队列用于实现QoS（服务质量）策略，确保高优先级的数据包（如实时视频流）可以优先传输。

### 实时数据处理

在金融市场、网络监控等领域，实时数据处理至关重要。优先队列可以帮助快速处理最重要的数据，从而做出及时的决策。

## 结语

优先队列是一种强大而灵活的数据结构，它在多个领域中发挥着重要作用。通过本文的介绍，我们不仅理解了优先队列的原理和实现，还了解了它在实际应用中的广泛用途。掌握优先队列，无疑会为我们解决复杂问题提供更多帮助。

## [github项目](https://github.com/nadav-cheung/algorithm)