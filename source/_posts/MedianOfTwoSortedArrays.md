---
title: Two Sorted Arrays
categories:
  - LeetCode刷题笔记
tags:
  - 算法与数据结构
  - LeetCode
abbrlink: cbfbeb4e
---

解决 "Median of Two Sorted Arrays" 这个问题通常涉及到以下几个步骤：

1. **理解问题**:
   - 目标是找到两个已排序数组的中位数。
   - 假设数组 `nums1` 和 `nums2` 都不为空，并且它们的总长度是 `n`。

2. **检查特殊情况**:
   - 如果一个数组为空，中位数就是另一个数组的中位数。
   - 如果两个数组的总长度是偶数，中位数是中间两个数的平均值；如果是奇数，则是中间的那个数。

3. **二分搜索法**:
   - 使用二分搜索找到合适的切分位置。这意味着在 `nums1` 和 `nums2` 中找到两个位置 `i` 和 `j`，使得 `nums1[i-1] <= nums2[j]` 和 `nums2[j-1] <= nums1[i]`。
   - 这个过程需要不断调整 `i` 和 `j` 以满足上述条件，同时保证 `i + j = (n + 1) / 2`。

4. **计算中位数**:
   - 一旦找到合适的 `i` 和 `j`，中位数可以通过比较 `nums1[i-1]`、`nums1[i]`、`nums2[j-1]` 和 `nums2[j]` 来确定。
   - 如果总长度是奇数，则中位数是 `max(nums1[i-1], nums2[j-1])`。
   - 如果总长度是偶数，则中位数是 `(max(nums1[i-1], nums2[j-1]) + min(nums1[i], nums2[j])) / 2`。

5. **边界条件处理**:
   - 在二分搜索过程中，需要考虑数组边界情况。例如，当 `i` 为 0 或 `n` 时，应该相应地处理 `nums1[i-1]` 或 `nums1[i]`。

6. **时间复杂度分析**:
   - 此算法的时间复杂度通常是 O(log(min(m, n)))，其中 `m` 和 `n` 是两个数组的长度。
   

实现这个算法时，关键在于理解如何通过二分搜索在两个数组中找到正确的切分点，以及如何处理边界情况。


<!-- more -->



### 解题步骤

1. **选择较短的数组进行二分查找**：
   - 为了优化性能，总是在两个数组中较短的那个上执行二分查找。
2. **二分查找的应用**：
   - 使用二分查找找到一个切分点，这个切分点将两个数组划分为左右两部分，使得左边所有元素都小于右边的所有元素。
3. **确保切分的正确性**：
   - 确保左侧部分的最大值小于或等于右侧部分的最小值。
4. **计算中位数**：
   - 如果两个数组的总长度是偶数，中位数是左侧最大值和右侧最小值的平均数。
   - 如果总长度是奇数，中位数是左侧的最大值。
5. **处理边界条件**：
   - 考虑数组长度为零或者切分点在数组的起始或结束位置的情况。

### Java 实现

```java
public class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        // 确保 nums1 是较短的数组
        if (nums1.length > nums2.length) {
            int[] temp = nums1;
            nums1 = nums2;
            nums2 = temp;
        }

        int m = nums1.length;
        int n = nums2.length;
        int imin = 0, imax = m, halfLen = (m + n + 1) / 2;

        while (imin <= imax) {
            int i = (imin + imax) / 2;
            int j = halfLen - i;

            if (i < imax && nums2[j - 1] > nums1[i]){
                imin = i + 1; // i is too small
            } else if (i > imin && nums1[i - 1] > nums2[j]) {
                imax = i - 1; // i is too big
            } else { // i is perfect
                int maxLeft = 0;
                if (i == 0) { maxLeft = nums2[j - 1]; }
                else if (j == 0) { maxLeft = nums1[i - 1]; }
                else { maxLeft = Math.max(nums1[i - 1], nums2[j - 1]); }

                if ( (m + n) % 2 == 1 ) { return maxLeft; }

                int minRight = 0;
                if (i == m) { minRight = nums2[j]; }
                else if (j == n) { minRight = nums1[i]; }
                else { minRight = Math.min(nums2[j], nums1[i]); }

                return (maxLeft + minRight) / 2.0;
            }
        }
        return 0.0;
    }
}
```

在这个实现中，我们首先确定两个数组中较短的那个，并在其上执行二分查找。我们不断地调整切分位置，直到找到一个位置，使得左侧所有元素都小于或等于右侧所有元素。然后根据左右两侧元素的最大值和最小值计算出中位数。这种方法的时间复杂度为 O(log(min(m, n)))，其中 m 和 n 分别是两个数组的长度。