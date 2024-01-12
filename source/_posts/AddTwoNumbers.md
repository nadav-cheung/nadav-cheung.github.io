---
title: addTwoNumbers
categories:
  - LeetCode刷题笔记
tags:
  - 算法与数据结构
  - LeetCode
top: 100
---

在 LeetCode 上，“Add Two Numbers” 是一个中等难度的问题，通常涉及链表的操作。这个问题的描述是：你有两个非空的链表，代表两个非负的整数。它们的每个节点都包含一个数字。数字以相反的顺序存储，每个节点包含一个数字。你需要将这两个数相加，并将它们作为一个链表返回。

问题的关键在于处理链表的遍历和进位。下面是使用 Java 实现的一个解决方案。

### Java 解决方案

```java
public class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

public class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummyHead = new ListNode(0);
        ListNode p = l1, q = l2, curr = dummyHead;
        int carry = 0;
        while (p != null || q != null) {
            int x = (p != null) ? p.val : 0;
            int y = (q != null) ? q.val : 0;
            int sum = carry + x + y;
            carry = sum / 10;
            curr.next = new ListNode(sum % 10);
            curr = curr.next;
            if (p != null) p = p.next;
            if (q != null) q = q.next;
        }
        if (carry > 0) {
            curr.next = new ListNode(carry);
        }
        return dummyHead.next;
    }
}
```

<!-- more -->

### 解释

1. **创建虚拟头节点**：使用一个虚拟头节点 `dummyHead` 来简化边界情况的处理，这样每个节点都可以统一处理。

2. **遍历链表**：同时遍历两个链表 `l1` 和 `l2`，直到两者都到达尾部。

3. **计算和与进位**：每一步计算两个节点的和，加上前一步的进位（如果有的话）。新的进位是和除以 10 的结果，而新节点的值是和对 10 的余数。

4. **创建新节点**：为每一步的和创建一个新的节点，并将其添加到当前节点的 `next`。

5. **移动指针**：移动 `l1`、`l2` 和 `curr` 指针。

6. **检查最后的进位**：如果最后还有进位（大于 0），需要创建一个新的节点。

7. **返回结果**：因为 `dummyHead` 是虚拟头节点，所以返回 `dummyHead.next`。

这个解法的时间复杂度是 O(max(n, m))，其中 n 和 m 分别是两个链表的长度。空间复杂度是 O(max(n, m))，主要用于存储新链表。