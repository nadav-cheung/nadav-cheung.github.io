---
title: twoSum
categories:
  - LeetCode刷题笔记
tags:
  - 算法与数据结构
  - LeetCode
top: 1
---
### Java 解决方案

```java
import java.util.HashMap;
import java.util.Map;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        throw new IllegalArgumentException("No two sum solution");
    }
}
```

<!-- more -->

### 解释

1. **创建哈希表**：使用 `HashMap` 来存储已经遍历过的元素和它们的索引。

2. **遍历数组**：循环遍历数组中的每个元素。

3. **计算补数**：对于每个元素，计算 `target` 减去该元素的值，得到“补数”。

4. **检查哈希表**：检查这个补数是否已经存在于哈希表中。如果存在，表示找到了一对符合条件的元素。

5. **返回结果**：如果找到符合条件的元素，返回它们的索引。

6. **更新哈希表**：如果当前元素的补数不在哈希表中，将当前元素及其索引添加到哈希表中。

请注意，这个解法的时间复杂度是 O(n)，因为它只遍历数组一次。空间复杂度也是 O(n)，用于存储哈希表。