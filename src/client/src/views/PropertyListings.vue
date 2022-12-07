<template>
  <div class="properties">
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" />
    <el-table v-loading="loading" :data="paginatedHotels" style="width: 100%">
      <el-table-column prop="propertyId" label="propertyId" width="auto" />
      <el-table-column prop="ActiveExpression.meta.property.name" label="name" width="auto" />
      <el-table-column prop="ActiveExpression.meta.property.location.country" label="country" width="auto" />
      <el-table-column prop="ActiveExpression.meta.property.reviews.summary.score" label="score/100" width="auto" />
      <el-table-column fixed="right" label="Operations" width="auto">
        <template #default="scope">
          <el-button id="update" size="small" @click="viewHandler(scope.row)"
            >View</el-button>
          <el-button id="delete" size="small" type="danger" @click="deleteHandler(scope.row.id)">
            Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination
          background
          layout="prev, pager, next"
          @current-change="handleCurrentChange"
          :page-size="pageSize"
          :total="hotels.length">
      </el-pagination>
    </div>

    <el-dialog v-model="dialogFormVisible" :title="activeExpression?.meta?.property?.name">
      <div class="listing-container">
        <img :alt="activeExpression?.meta?.property?.name" :src="activeExpression?.meta?.property?.heroImage?.url" class="image"/>
        <div>
          <el-radio-group v-model="expressionsRadio">
            <el-radio
              v-for="(expression, i) in expressions"
              :key="expression.id"
              :label="i"
              @click="switchExpression(expression)"
              size="large">
              {{ formatTime(expression.createdAt) }}
            </el-radio>
          </el-radio-group>
        </div>
      </div>
      <el-form class="form" :model="form">
        <el-form-item label="Name">
          <el-input v-model="form.name" autocomplete="off" :disabled="!editing" />
        </el-form-item>
        <el-form-item label="Country">
          <el-input v-model="form.country" autocomplete="off" :disabled="!editing" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button v-if="expressionsIsSwitched" type="danger" @click="deleteExpressionHandler">
            Delete
          </el-button>
          <el-button @click="onCancel">Cancel</el-button>
          <el-button v-if="editing" :disabled="!canSave" type="primary" @click="onSave">
            Save
          </el-button>
          <el-button v-else type="primary" @click="toggleEdit">
            Edit
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref } from 'vue';
import axios from 'axios';
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus';
import moment from 'moment';
import { cloneDeep } from 'lodash';

export default {
  data() {
    return {
      hotels: [],
      hotel: {},
      loading: null,
      errorMessage: null,
      page: 1,
      pageSize: 5,
      dialogFormVisible: ref(false),
      form: {
        name: '',
        country: '',
      },
      editing: false,
      expressions: [],
      activeExpression: {},
      expressionsRadio: '',
      activeListingId: null,
      activeExpressionId: null,
      expressionsIsSwitched: false,
    };
  },
  mounted() {
    this.fetchListings();
  },
  computed: {
    canSave() {
      return this.form.name !== '' && this.form.country !== '';
    },
    paginatedHotels() {
      if (!this.hotels || this.hotels.length === 0) return [];
      return this.hotels.slice(this.pageSize * this.page - this.pageSize, this.pageSize * this.page);
    },
  },
  watch: {
    activeExpression: {
      immediate: true,
      handler(nV) {
        if (nV) {
          const clonedExpression = cloneDeep(nV);
          this.form.name = clonedExpression?.meta?.property?.name;
          this.form.country = clonedExpression?.meta?.property?.location?.country;
        }
      },
    },
  },
  methods: {
    async onSave() {
      try {
        if (!this.canSave) return;

        const updatedExpression = cloneDeep(this.activeExpression);
        const expressionId = updatedExpression.id;

        updatedExpression.meta.property.name = this.form.name;
        updatedExpression.meta.property.location.country = this.form.country;

        await axios.post(`http://localhost:3001/listings/${this.activeListingId}/expressions/${expressionId}`, {
          ...updatedExpression,
        });

        this.showNotification('You have successfully updated the listing');
        await this.fetchListings();
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.editing = false;
        this.dialogFormVisible = false;
      }
    },

    onCancel() {
      this.editing = false;
      this.dialogFormVisible = false;
    },

    async fetchListings() {
      try {
        this.errorMessage = null;
        this.loading = ref(true);

        const response = await axios.get('http://localhost:3001/listings');
        this.hotels = response.data;

        this.loading = ref(false);
      } catch (error) {
        this.errorMessage = error.message;
      }
    },

    async fetchDetailListing(id) {
      try {
        this.errorMessage = null;
        this.loading = ref(true);

        const response = await axios.get(`http://localhost:3001/listings/${id}`);
        this.hotel = response.data;

        this.loading = ref(false);
      } catch (error) {
        this.errorMessage = error.message;
      }
    },

    async viewHandler(obj) {
      this.dialogFormVisible = true;

      await this.fetchDetailListing(obj.id);

      if (Object.keys(this.hotel).length) {
        const activeExpression = this.hotel.Expressions.find((el) => el.id === obj.activeExpression);
        this.expressions = this.hotel.Expressions;
        this.activeExpression = activeExpression;
        this.activeListingId = this.hotel.id;
        this.activeExpressionId = obj.activeExpression;
      }
    },

    async deleteHandler(id, isExpression = false) {
      try {
        const { confirmedProceed } = await this.confirmDeleteHandler(isExpression);
        if (confirmedProceed) {
          const url = `http://localhost:3001/listings/${id}${!isExpression ? '' : `/expressions/${this.activeExpression.id}`}`;
          const message = `You have deleted the ${!isExpression ? 'listing' : 'expression'}`;

          await axios.delete(url);

          if (isExpression) {
            this.removeDeletedExpression(this.activeExpression.id);
          } else this.fetchListings();

          this.showNotification(message);
        }
      } catch (error) {
        this.errorMessage = error.message;
      }
    },

    removeDeletedExpression(id) {
      this.expressions = this.expressions.filter((el) => el.id !== id);
      if (this.expressions.length === 0) {
        this.dialogFormVisible = false;
        this.loading = true;
        this.hotels = this.hotels.filter((el) => el.id !== this.activeListingId);
        this.loading = false;
      } else this.activeExpression = this.expressions.find((el) => el.id === this.activeExpressionId);
    },

    async confirmDeleteHandler(isExpression) {
      try {
        const message = `The ${!isExpression ? 'listing' : 'expression'} will be deleted. Continue?`;
        const confirmedProceed = await ElMessageBox.confirm(
          message,
          'Warning',
          {
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            type: 'warning',
          },
        );
        return Promise.resolve({ confirmedProceed });
      } catch (err) {
        this.showMessage('Delete canceled', 'info');
        return Promise.reject(err);
      }
    },

    async deleteExpressionHandler() {
      await this.deleteHandler(this.activeListingId, true);
    },

    handleCurrentChange(val) {
      this.page = val;
    },

    showNotification(message) {
      ElNotification({
        title: 'Success',
        message,
        type: 'success',
      });
    },

    showMessage(message, type) {
      ElMessage({
        message,
        type,
      });
    },

    toggleEdit() {
      this.editing = true;
    },

    formatTime(time) {
      return moment(time).fromNow();
    },

    switchExpression(expression) {
      this.activeExpression = expression;
      this.expressionsIsSwitched = true;
    },
  },
};

</script>

<style scoped>
.pagination {
  margin: auto;
  width: 20%;
  padding: 20px;
}

.listing-container {
  display: grid;
  grid-template-columns: 0.6fr 0.4fr;
  grid-gap: 15px;
}

.image {
  border-radius: 5px;
}

.form {
  margin-top: 30px
}
</style>
